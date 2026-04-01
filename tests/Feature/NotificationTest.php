<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\OrderStatusChangedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);

    Setting::set('price_per_pound', 25.00);
    Setting::set('filleting_fee', 10.00);
    Setting::set('delivery_fee', 5.00);

    Inventory::current()->update(['stock_kg' => 500]);
});

// ── OrderPlacedNotification ───────────────────────────────────────────────────

test('admins are notified when a client places an order', function (): void {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => false,
            'delivery' => false,
        ]);

    Notification::assertSentTo($admin, OrderPlacedNotification::class);
});

test('admins are notified when staff places a guest order', function (): void {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->staff()->create())
        ->post(route('admin.orders.guest.store'), [
            'guest_name' => 'Walk-in',
            'guest_phone' => '123',
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ]);

    Notification::assertSentTo($admin, OrderPlacedNotification::class);
});

test('non-admin users are not notified on order placed', function (): void {
    Notification::fake();

    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ]);

    Notification::assertNotSentTo($client, OrderPlacedNotification::class);
});

// ── OrderStatusChangedNotification ───────────────────────────────────────────

test('client is notified when their order status changes', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed']);

    Notification::assertSentTo($client, OrderStatusChangedNotification::class,
        fn ($notification) => $notification->newStatus === 'confirmed'
    );
});

test('client is notified with rejection reason when order is rejected', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), [
            'status' => 'rejected',
            'rejection_reason' => 'Out of stock',
        ]);

    Notification::assertSentTo($client, OrderStatusChangedNotification::class,
        fn ($notification) => $notification->newStatus === 'rejected'
    );
});

test('no notification is sent for guest order status changes', function (): void {
    Notification::fake();

    $order = Order::factory()->create(['status' => 'placed', 'user_id' => null, 'guest_name' => 'Walk-in']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed']);

    Notification::assertNothingSent();
});
