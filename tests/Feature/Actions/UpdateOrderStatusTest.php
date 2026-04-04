<?php

use App\Actions\UpdateOrderStatus;
use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    Inventory::current()->update(['stock_kg' => 100]);
});

test('transitions order to new status', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);
    $admin = User::factory()->admin()->create();

    app(UpdateOrderStatus::class)->handle($order, 'confirmed', null, $admin);

    expect((string) $order->fresh()->status)->toBe('confirmed');
});

test('records status log with acting user', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);
    $admin = User::factory()->admin()->create();

    app(UpdateOrderStatus::class)->handle($order, 'confirmed', null, $admin);

    $log = $order->statusLogs()->reorder()->orderByDesc('id')->first();
    expect($log->status)->toBe('confirmed')
        ->and($log->user_id)->toBe($admin->id);
});

test('deducts inventory when status is packed', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $order = Order::factory()->create([
        'status' => 'confirmed',
        'filleting_fee_snapshot' => 10,
        'delivery_fee_snapshot' => 5,
        'total_sbd' => 110,
    ]);
    $order->items()->create([
        'fish_type_id' => $tuna->id,
        'quantity_kg' => 15,
        'quantity_pounds' => 33.07,
        'kg_to_lbs_rate_snapshot' => 2.20462,
        'subtotal_sbd' => 826.73,
        'price_per_pound_snapshot' => 25,
    ]);
    $order->load('items.fishType');

    $admin = User::factory()->admin()->create();

    app(UpdateOrderStatus::class)->handle($order, 'packed', null, $admin);

    expect((float) Inventory::current()->stock_kg)->toBe(85.0);
});

test('does not deduct inventory for non-packed transitions', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);
    $admin = User::factory()->admin()->create();

    app(UpdateOrderStatus::class)->handle($order, 'confirmed', null, $admin);

    expect((float) Inventory::current()->stock_kg)->toBe(100.0);
});

test('stores rejection reason on reject', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);
    $admin = User::factory()->admin()->create();

    app(UpdateOrderStatus::class)->handle($order, 'rejected', 'Out of stock', $admin);

    expect($order->fresh()->rejection_reason)->toBe('Out of stock');
});
