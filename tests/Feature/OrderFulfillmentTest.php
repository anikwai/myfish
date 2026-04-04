<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);

    defaultPricing();

    Inventory::current()->update(['stock_kg' => 500]);
});

// ── Role access ──────────────────────────────────────────────────────────────

test('clients cannot access admin order list', function (): void {
    $this->actingAs(User::factory()->client()->create())
        ->get(route('admin.orders.index'))
        ->assertForbidden();
});

test('staff can access admin order list', function (): void {
    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.orders.index'))
        ->assertOk();
});

test('admin can access admin order list', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.orders.index'))
        ->assertOk();
});

// ── Order list & filtering ────────────────────────────────────────────────────

test('admin can filter orders by status', function (): void {
    $client = User::factory()->client()->create();

    $placed = Order::factory()->for($client)->create(['status' => 'placed']);
    Order::factory()->for($client)->create(['status' => 'confirmed']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.orders.index', ['status' => 'placed']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $placed->id)
        );
});

test('admin can search orders by customer name', function (): void {
    $alice = User::factory()->client()->create(['name' => 'Alice Smith']);
    $bob = User::factory()->client()->create(['name' => 'Bob Jones']);

    Order::factory()->for($alice)->create();
    Order::factory()->for($bob)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.orders.index', ['search' => 'Alice']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('orders.data', 1));
});

test('admin can search orders by order id', function (): void {
    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create();
    Order::factory()->for($client)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.orders.index', ['search' => $order->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $order->id)
        );
});

// ── Status transitions ────────────────────────────────────────────────────────

test('admin can confirm a placed order', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed'])
        ->assertRedirect(route('admin.orders.show', $order));

    expect((string) $order->fresh()->status)->toBe('confirmed');
});

test('admin can reject a placed order with a reason', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), [
            'status' => 'rejected',
            'rejection_reason' => 'Out of stock',
        ]);

    $order->refresh();
    expect((string) $order->status)->toBe('rejected');
    expect($order->rejection_reason)->toBe('Out of stock');
});

test('admin can put a placed order on hold', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'on_hold']);

    expect((string) $order->fresh()->status)->toBe('on_hold');
});

test('admin can pack a confirmed order and stock is deducted', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $order = Order::factory()->create([
        'status' => 'confirmed',
        'filleting_fee_snapshot' => 10,
        'delivery_fee_snapshot' => 5,
        'total_sbd' => 110,
    ]);

    $order->items()->create([
        'fish_type_id' => $tuna->id,
        'quantity_kg' => 10,
        'quantity_pounds' => 22.046,
        'kg_to_lbs_rate_snapshot' => 2.20462,
        'subtotal_sbd' => 551.15,
        'price_per_pound_snapshot' => 25,
    ]);

    Inventory::current()->update(['stock_kg' => 100]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'packed']);

    expect((string) $order->fresh()->status)->toBe('packed');
    expect(Inventory::current()->stock_kg)->toEqual('90.000'); // 100 - 10
});

test('admin can mark a packed order as delivered', function (): void {
    $order = Order::factory()->create(['status' => 'packed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    expect((string) $order->fresh()->status)->toBe('delivered');
});

test('invalid transitions are rejected', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered'])
        ->assertSessionHasErrors('status');

    expect((string) $order->fresh()->status)->toBe('placed');
});

test('staff can update order status', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs(User::factory()->staff()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed'])
        ->assertRedirect();

    expect((string) $order->fresh()->status)->toBe('confirmed');
});

test('clients cannot update order status', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs(User::factory()->client()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed'])
        ->assertForbidden();
});

// ── Guest orders ──────────────────────────────────────────────────────────────

test('staff can create a guest order', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->staff()->create())
        ->post(route('admin.orders.guest.store'), [
            'guest_name' => 'John Doe',
            'guest_phone' => '+677 12345',
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 3]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $order = Order::first();
    expect($order->user_id)->toBeNull();
    expect($order->guest_name)->toBe('John Doe');
    expect($order->guest_phone)->toBe('+677 12345');
    expect((string) $order->status)->toBe('placed');
});

test('guest order requires name and phone', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->staff()->create())
        ->post(route('admin.orders.guest.store'), [
            'guest_name' => '',
            'guest_phone' => '',
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertSessionHasErrors(['guest_name', 'guest_phone']);
});

test('clients cannot create guest orders', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('admin.orders.guest.store'), [
            'guest_name' => 'Jane',
            'guest_phone' => '123',
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertForbidden();
});
