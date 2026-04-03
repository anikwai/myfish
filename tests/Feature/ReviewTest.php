<?php

use App\Models\Inventory;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use App\Notifications\ReviewInviteNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
    Inventory::current()->update(['stock_kg' => 500]);
});

// ── Submission page ───────────────────────────────────────────────────────────

test('review page loads with valid signed url', function (): void {
    $order = Order::factory()->create(['status' => 'delivered']);
    $url = URL::temporarySignedRoute('reviews.show', now()->addDays(30), ['order' => $order->id]);

    $this->get($url)->assertOk()->assertInertia(fn ($page) => $page->component('orders/review'));
});

test('review page returns 403 with invalid signature', function (): void {
    $order = Order::factory()->create();

    $this->get(route('reviews.show', $order))->assertForbidden();
});

test('customer can submit a review via signed url', function (): void {
    $order = Order::factory()->create(['guest_name' => 'John Smith']);
    $url = URL::temporarySignedRoute('reviews.store', now()->addDays(30), ['order' => $order->id]);

    $this->post($url, ['rating' => 5, 'comment' => 'Excellent!'])->assertRedirect();

    $review = Review::first();
    expect($review)->not->toBeNull()
        ->and($review->rating)->toBe(5)
        ->and($review->comment)->toBe('Excellent!')
        ->and($review->reviewer_name)->toBe('John');
});

test('reviewer name uses first name only', function (): void {
    $order = Order::factory()->create(['guest_name' => 'Mary Jane Watson']);
    $url = URL::temporarySignedRoute('reviews.store', now()->addDays(30), ['order' => $order->id]);

    $this->post($url, ['rating' => 4]);

    expect(Review::first()->reviewer_name)->toBe('Mary');
});

test('rating is required', function (): void {
    $order = Order::factory()->create();
    $url = URL::temporarySignedRoute('reviews.store', now()->addDays(30), ['order' => $order->id]);

    $this->post($url, ['comment' => 'Nice'])->assertSessionHasErrors(['rating']);
});

test('rating must be between 1 and 5', function (): void {
    $order = Order::factory()->create();
    $url = URL::temporarySignedRoute('reviews.store', now()->addDays(30), ['order' => $order->id]);

    $this->post($url, ['rating' => 6])->assertSessionHasErrors(['rating']);
    $this->post($url, ['rating' => 0])->assertSessionHasErrors(['rating']);
});

test('comment cannot exceed 500 characters', function (): void {
    $order = Order::factory()->create();
    $url = URL::temporarySignedRoute('reviews.store', now()->addDays(30), ['order' => $order->id]);

    $this->post($url, ['rating' => 3, 'comment' => str_repeat('a', 501)])
        ->assertSessionHasErrors(['comment']);
});

test('second review submission for same order is ignored', function (): void {
    $order = Order::factory()->create();
    Review::factory()->create(['order_id' => $order->id]);

    $url = URL::temporarySignedRoute('reviews.store', now()->addDays(30), ['order' => $order->id]);
    $this->post($url, ['rating' => 1]);

    expect(Review::count())->toBe(1);
});

test('already reviewed page shows confirmation state', function (): void {
    $order = Order::factory()->create();
    Review::factory()->create(['order_id' => $order->id]);

    $url = URL::temporarySignedRoute('reviews.show', now()->addDays(30), ['order' => $order->id]);

    $this->get($url)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('already_reviewed', true));
});

// ── Review invite notification ────────────────────────────────────────────────

test('review invite is sent to client when order is delivered', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'packed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    Notification::assertSentTo($client, ReviewInviteNotification::class,
        fn ($n) => $n->order->id === $order->id
    );
});

test('review invite is sent to guest email when order is delivered', function (): void {
    Notification::fake();

    $order = Order::factory()->create([
        'status' => 'packed',
        'user_id' => null,
        'guest_name' => 'John',
        'guest_email' => 'john@example.com',
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    Notification::assertSentOnDemand(ReviewInviteNotification::class);
});

test('review invite is not sent when order already has a review', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'packed']);
    Review::factory()->create(['order_id' => $order->id]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    Notification::assertNotSentTo($client, ReviewInviteNotification::class);
});

// ── Admin reviews page ────────────────────────────────────────────────────────

test('admin can view the reviews page', function (): void {
    Review::factory()->count(3)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reviews.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reviews')
            ->has('reviews', 3)
            ->has('stats.total')
        );
});

test('admin can delete a review', function (): void {
    $review = Review::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->delete(route('admin.reviews.destroy', $review))
        ->assertRedirect(route('admin.reviews.index'));

    expect(Review::count())->toBe(0);
});

test('non-admin cannot access the admin reviews page', function (): void {
    $this->actingAs(User::factory()->client()->create())
        ->get(route('admin.reviews.index'))
        ->assertForbidden();
});
