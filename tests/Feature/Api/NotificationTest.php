<?php

use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusChangedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

// OrderStatusUpdated broadcast event

it('broadcasts OrderStatusUpdated when an order transitions status', function (): void {
    Event::fake([OrderStatusUpdated::class]);

    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

    $order->transitionTo('confirmed', actor: $user);

    Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) use ($order) {
        return $event->order->id === $order->id && $event->newStatus === 'confirmed';
    });
});

it('broadcasts on the private orders channel for the correct order', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);
    $event = new OrderStatusUpdated($order, 'confirmed');

    $channels = $event->broadcastOn();

    expect($channels)->toHaveCount(1)
        ->and($channels[0]->name)->toBe('private-orders.'.$order->id);
});

it('broadcasts the order id and new status as the event payload', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);
    $event = new OrderStatusUpdated($order, 'confirmed');

    expect($event->broadcastWith())->toBe([
        'order_id' => $order->id,
        'status' => 'confirmed',
    ]);
});

// Channel authorization

it('authorises the order owner on the private orders channel', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id]);

    $response = postJson('/api/v1/broadcasting/auth', [
        'channel_name' => 'private-orders.'.$order->id,
        'socket_id' => '123.456',
    ], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ]);

    $response->assertSuccessful();
});

it('channel callback denies access to a non-owner', function (): void {
    $user = User::factory()->client()->create();
    $otherOrder = Order::factory()->create(['user_id' => null]);

    $allowed = Order::where('id', $otherOrder->id)->where('user_id', $user->id)->exists();

    expect($allowed)->toBeFalse();
});

it('channel callback grants access to the order owner', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id]);

    $allowed = Order::where('id', $order->id)->where('user_id', $user->id)->exists();

    expect($allowed)->toBeTrue();
});

it('rejects channel auth for unauthenticated requests', function (): void {
    $order = Order::factory()->create();

    postJson('/api/v1/broadcasting/auth', [
        'channel_name' => 'private-orders.'.$order->id,
        'socket_id' => '123.456',
    ])
        ->assertUnauthorized();
});

// GET /api/v1/notifications

it('returns the authenticated user notifications', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

    $user->notify(new OrderStatusChangedNotification($order, 'confirmed'));

    getJson('/api/v1/notifications', [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertOk()
        ->assertJsonStructure(['data', 'next_cursor', 'next_page_url']);
});

it('returns 401 for unauthenticated notification requests', function (): void {
    getJson('/api/v1/notifications')->assertUnauthorized();
});

it('does not return other users notifications', function (): void {
    $user = User::factory()->client()->create();
    $other = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $other->id, 'status' => 'placed']);

    $other->notify(new OrderStatusChangedNotification($order, 'confirmed'));

    $response = getJson('/api/v1/notifications', [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])->assertOk();

    expect($response->json('data'))->toBeEmpty();
});

// POST /api/v1/notifications/{id}/read

it('marks a notification as read', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

    $user->notify(new OrderStatusChangedNotification($order, 'confirmed'));
    $notification = $user->notifications()->first();

    postJson("/api/v1/notifications/{$notification->id}/read", [], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertOk()
        ->assertJsonFragment(['message' => 'Notification marked as read.']);

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

it('returns 403 when marking another users notification as read', function (): void {
    $user = User::factory()->client()->create();
    $other = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $other->id, 'status' => 'placed']);

    $other->notify(new OrderStatusChangedNotification($order, 'confirmed'));
    $notification = $other->notifications()->first();

    postJson("/api/v1/notifications/{$notification->id}/read", [], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertForbidden();
});
