<?php

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusChangedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

// ── Notification channels ─────────────────────────────────────────────────────

test('OrderStatusChangedNotification sends via mail, database, and broadcast channels', function (): void {
    $order = Order::factory()->create();
    $notification = new OrderStatusChangedNotification($order, 'confirmed');

    expect($notification->via(new stdClass))->toBe(['mail', 'database', 'broadcast']);
});

test('OrderStatusChangedNotification toArray contains expected keys', function (): void {
    $order = Order::factory()->create();
    $notification = new OrderStatusChangedNotification($order, 'confirmed');

    $data = $notification->toArray(new stdClass);

    expect($data)
        ->toHaveKey('title')
        ->toHaveKey('message')
        ->toHaveKey('order_id', $order->id)
        ->toHaveKey('status', 'confirmed');
});

// ── Notifications index ───────────────────────────────────────────────────────

test('authenticated user can view notifications page', function (): void {
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('notifications/index')->has('notifications'));
});

test('guests cannot view notifications page', function (): void {
    $this->get(route('notifications.index'))->assertRedirect(route('login'));
});

// ── Recent notifications ──────────────────────────────────────────────────────

test('authenticated user can fetch recent notifications', function (): void {
    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create();

    $client->notify(new OrderStatusChangedNotification($order, 'confirmed'));

    $this->actingAs($client)
        ->getJson(route('notifications.recent'))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonStructure([['id', 'data', 'read_at', 'created_at']]);
});

// ── Mark as read ──────────────────────────────────────────────────────────────

test('user can mark a notification as read', function (): void {
    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create();

    $client->notify(new OrderStatusChangedNotification($order, 'confirmed'));
    $notification = $client->notifications()->first();

    expect($notification->read_at)->toBeNull();

    $this->actingAs($client)
        ->postJson(route('notifications.read', $notification->id))
        ->assertOk()
        ->assertJson(['ok' => true]);

    expect($notification->fresh()->read_at)->not()->toBeNull();
});

test("user cannot mark another user's notification as read", function (): void {
    $client = User::factory()->client()->create();
    $other = User::factory()->client()->create();
    $order = Order::factory()->for($other)->create();

    $other->notify(new OrderStatusChangedNotification($order, 'confirmed'));
    $notification = $other->notifications()->first();

    $this->actingAs($client)
        ->postJson(route('notifications.read', $notification->id))
        ->assertOk();

    // Notification belongs to $other, not $client — should remain unread
    expect($notification->fresh()->read_at)->toBeNull();
});

// ── Mark all as read ──────────────────────────────────────────────────────────

test('user can mark all notifications as read', function (): void {
    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create();

    $client->notify(new OrderStatusChangedNotification($order, 'confirmed'));
    $client->notify(new OrderStatusChangedNotification($order, 'packed'));

    expect($client->unreadNotifications()->count())->toBe(2);

    $this->actingAs($client)
        ->postJson(route('notifications.read-all'))
        ->assertOk()
        ->assertJson(['ok' => true]);

    expect($client->unreadNotifications()->count())->toBe(0);
});
