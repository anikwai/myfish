<?php

use App\Actions\SubmitOrderReview;
use App\Exceptions\OrderAlreadyReviewedException;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    Inventory::current()->update(['stock_kg' => 500]);
});

test('creates a review for the order', function (): void {
    $order = Order::factory()->create(['guest_name' => 'John Smith']);

    app(SubmitOrderReview::class)->handle($order, 5, 'Great fish!');

    $review = Review::first();
    expect($review)->not->toBeNull()
        ->and($review->rating)->toBe(5)
        ->and($review->comment)->toBe('Great fish!');
});

test('derives reviewer name from guest first name', function (): void {
    $order = Order::factory()->create(['guest_name' => 'Mary Jane Watson']);

    app(SubmitOrderReview::class)->handle($order, 4, null);

    expect(Review::first()->reviewer_name)->toBe('Mary');
});

test('derives reviewer name from user first name', function (): void {
    $user = User::factory()->client()->create(['name' => 'Robert Paulson']);
    $order = Order::factory()->for($user)->create(['guest_name' => null]);
    $order->load('user');

    app(SubmitOrderReview::class)->handle($order, 3, null);

    expect(Review::first()->reviewer_name)->toBe('Robert');
});

test('throws when order already has a review', function (): void {
    $order = Order::factory()->create();
    Review::factory()->create(['order_id' => $order->id]);

    expect(fn () => app(SubmitOrderReview::class)->handle($order, 5, null))
        ->toThrow(OrderAlreadyReviewedException::class);
});

test('does not create a duplicate review on exception', function (): void {
    $order = Order::factory()->create();
    Review::factory()->create(['order_id' => $order->id]);

    try {
        app(SubmitOrderReview::class)->handle($order, 5, null);
    } catch (OrderAlreadyReviewedException) {
    }

    expect(Review::count())->toBe(1);
});
