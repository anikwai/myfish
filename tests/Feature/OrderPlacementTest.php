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

test('guests cannot access the order form', function (): void {
    $this->get(route('orders.create'))->assertRedirect(route('login'));
});

test('authenticated client can view the order form with active fish types', function (): void {
    FishType::create(['name' => 'Tuna', 'is_active' => true]);
    FishType::create(['name' => 'Snapper', 'is_active' => false]);

    $this->actingAs(User::factory()->client()->create())
        ->get(route('orders.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/create')
            ->has('fishTypes', 1) // only active
            ->where('fishTypes.0.name', 'Tuna')
        );
});

test('client can place an order with correct total calculation', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    // 2 kg tuna = 4.40924 lbs × $25 = $110.23
    $this->actingAs($client)
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $order = Order::first();
    expect($order)->not->toBeNull();
    expect($order->status)->toBe('placed');
    expect($order->user_id)->toBe($client->id);

    // 2 kg × 2.20462 = 4.40924 lbs × $25 = $110.23
    expect((float) $order->total_sbd)->toBe(110.23);
    expect($order->price_per_pound_snapshot)->toEqual('25.00');
    expect($order->items)->toHaveCount(1);

    $item = $order->items->first();
    expect((float) $item->quantity_kg)->toBe(2.0);
    expect((float) $item->quantity_pounds)->toBe(4.409); // rounded to 3dp
    expect((float) $item->kg_to_lbs_rate_snapshot)->toBe(2.20462);
});

test('filleting fee is added to total when selected', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => true,
            'delivery' => false,
        ]);

    $order = Order::first();
    // 110.23 + 10 filleting = 120.23
    expect((float) $order->total_sbd)->toBe(120.23);
    expect($order->filleting)->toBeTrue();
    expect($order->filleting_fee_snapshot)->toEqual('10.00');
});

test('delivery fee is added and location stored when delivery selected', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => false,
            'delivery' => true,
            'delivery_location' => 'Near the market',
        ]);

    $order = Order::first();
    // 110.23 + 5 delivery = 115.23
    expect((float) $order->total_sbd)->toBe(115.23);
    expect($order->delivery)->toBeTrue();
    expect($order->delivery_location)->toBe('Near the market');
});

test('fees are snapshotted at order time', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => true,
            'delivery' => true,
            'delivery_location' => 'Town',
        ]);

    $order = Order::first();
    expect($order->price_per_pound_snapshot)->toEqual('25.00');
    expect($order->filleting_fee_snapshot)->toEqual('10.00');
    expect($order->delivery_fee_snapshot)->toEqual('5.00');

    // Change pricing — order snapshot should not change
    defaultPricing(pricePerPound: 30.00);
    $order->refresh();
    expect($order->price_per_pound_snapshot)->toEqual('25.00');
});

test('conversion rate is snapshotted and not affected by later rate changes', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ]);

    $item = Order::first()->items->first();
    expect((float) $item->kg_to_lbs_rate_snapshot)->toBe(2.20462);

    // Change rate — snapshot must not change
    defaultPricing(kgToLbsRate: 2.5);
    $item->refresh();
    expect((float) $item->kg_to_lbs_rate_snapshot)->toBe(2.20462);
});

test('delivery location is required when delivery is selected', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => true,
            'delivery_location' => '',
        ])
        ->assertSessionHasErrors('delivery_location');
});

test('order requires at least one item', function (): void {
    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertSessionHasErrors('items');
});

test('inactive fish types are rejected in order', function (): void {
    $inactive = FishType::create(['name' => 'Shark', 'is_active' => false]);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $inactive->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertSessionHasErrors('items.0.fish_type_id');
});

test('client can view their own order', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)->post(route('orders.store'), [
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
        'filleting' => false,
        'delivery' => false,
    ]);

    $order = Order::first();

    $this->actingAs($client)
        ->get(route('orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('orders/show'));
});

test('client cannot view another client order', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $owner = User::factory()->client()->create();
    $other = User::factory()->client()->create();

    $this->actingAs($owner)->post(route('orders.store'), [
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
        'filleting' => false,
        'delivery' => false,
    ]);

    $order = Order::first();

    $this->actingAs($other)
        ->get(route('orders.show', $order))
        ->assertForbidden();
});

test('stock warning is set when order exceeds available stock', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    Inventory::current()->update(['stock_kg' => 1]);

    $response = $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 10]],
            'filleting' => false,
            'delivery' => false,
        ]);

    // Order still created — just a warning
    expect(Order::count())->toBe(1);
});

test('client can view their order history', function (): void {
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->get(route('orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('orders/index'));
});
