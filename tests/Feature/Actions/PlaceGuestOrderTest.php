<?php

use App\Actions\PlaceGuestOrder;
use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Notifications\GuestOrderConfirmationNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
    Inventory::current()->update(['stock_kg' => 500]);
});

test('creates the order and returns it', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);
    Notification::fake();

    $result = app(PlaceGuestOrder::class)->handle([
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
    ]);

    expect($result['order'])->toBeInstanceOf(Order::class)
        ->and($result['order']->guest_name)->toBe('John Doe')
        ->and((string) $result['order']->status)->toBe('placed');
});

test('returns a signed url for the order', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);
    Notification::fake();

    $result = app(PlaceGuestOrder::class)->handle([
        'guest_name' => 'Jane',
        'guest_email' => 'jane@example.com',
        'guest_phone' => '+677 99999',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
        'filleting' => false,
        'delivery' => false,
    ]);

    expect($result['signedUrl'])->toContain(route('guest-orders.show', ['order' => $result['order']->id]));
});

test('dispatches confirmation notification', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);
    Notification::fake();

    app(PlaceGuestOrder::class)->handle([
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
    ]);

    Notification::assertSentOnDemand(GuestOrderConfirmationNotification::class);
});

test('stock warning is true when order exceeds current stock', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);
    Inventory::current()->update(['stock_kg' => 5]);
    Notification::fake();

    $result = app(PlaceGuestOrder::class)->handle([
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 10]],
        'filleting' => false,
        'delivery' => false,
    ]);

    expect($result['stockWarning'])->toBeTrue();
});

test('stock warning is false when order is within stock', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);
    Inventory::current()->update(['stock_kg' => 500]);
    Notification::fake();

    $result = app(PlaceGuestOrder::class)->handle([
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
    ]);

    expect($result['stockWarning'])->toBeFalse();
});
