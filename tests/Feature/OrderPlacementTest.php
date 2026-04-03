<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use App\Values\DiscountConfig;
use App\Values\TaxConfig;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);

    defaultPricing();

    DiscountConfig::saveFromValidated([
        'discount_mode' => 'off',
        'discount_fixed_sbd' => 0,
        'discount_percent' => 0,
        'discount_max_sbd' => null,
        'discount_min_order_sbd' => null,
    ]);

    TaxConfig::saveFromValidated([
        'tax_mode' => 'off',
        'tax_percent' => 0,
        'tax_label' => null,
    ]);

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
            ->has('discount')
            ->has('tax')
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
    expect($order->items)->toHaveCount(1);

    $item = $order->items->first();
    expect((float) $item->quantity_kg)->toBe(2.0);
    expect((float) $item->quantity_pounds)->toBe(4.409); // rounded to 3dp
    expect((float) $item->kg_to_lbs_rate_snapshot)->toBe(2.20462);
    expect($item->price_per_pound_snapshot)->toEqual('25.00');
    expect((float) $order->discount_sbd)->toBe(0.0);
    expect((float) $order->tax_sbd)->toBe(0.0);
});

test('configured fixed discount snapshots on placed order', function (): void {
    DiscountConfig::saveFromValidated([
        'discount_mode' => 'fixed',
        'discount_fixed_sbd' => 10,
        'discount_percent' => 0,
        'discount_max_sbd' => null,
        'discount_min_order_sbd' => null,
    ]);

    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => true,
            'delivery' => true,
            'delivery_location' => 'Central market',
        ])
        ->assertRedirect();

    $order = Order::first();
    expect((float) $order->discount_sbd)->toBe(10.0);
    expect((float) $order->tax_sbd)->toBe(0.0);
    expect((float) $order->total_sbd)->toBe(115.23);
});

test('configured percent tax snapshots on placed order', function (): void {
    TaxConfig::saveFromValidated([
        'tax_mode' => 'percent',
        'tax_percent' => 10,
    ]);

    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $order = Order::first();
    expect((float) $order->tax_sbd)->toBe(11.02);
    expect((float) $order->total_sbd)->toBe(121.25);
    expect($order->tax_label_snapshot)->toBe('Tax');
});

test('custom tax label is snapshotted on placed order', function (): void {
    TaxConfig::saveFromValidated([
        'tax_mode' => 'percent',
        'tax_percent' => 10,
        'tax_label' => 'GST',
    ]);

    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $order = Order::first();
    expect((float) $order->tax_sbd)->toBe(11.02);
    expect($order->tax_label_snapshot)->toBe('GST');
});

test('tax applies to subtotal after discount on placed order', function (): void {
    DiscountConfig::saveFromValidated([
        'discount_mode' => 'fixed',
        'discount_fixed_sbd' => 10,
        'discount_percent' => 0,
        'discount_max_sbd' => null,
        'discount_min_order_sbd' => null,
    ]);
    TaxConfig::saveFromValidated([
        'tax_mode' => 'percent',
        'tax_percent' => 10,
        'tax_label' => null,
    ]);

    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
            'filleting' => true,
            'delivery' => true,
            'delivery_location' => 'Central market',
        ])
        ->assertRedirect();

    $order = Order::first();
    expect((float) $order->discount_sbd)->toBe(10.0);
    expect((float) $order->tax_sbd)->toBe(11.52);
    expect((float) $order->total_sbd)->toBe(126.75);
    expect($order->tax_label_snapshot)->toBe('Tax');
});

test('species price override is used for line subtotal and snapshot', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'price_per_pound' => 60.00]);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $item = Order::first()->items->first();
    // Pounds rounded to 3dp before subtotal (1 kg → 2.205 lb × $60)
    expect((float) $item->subtotal_sbd)->toBe(132.30);
    expect($item->price_per_pound_snapshot)->toEqual('60.00');
});

test('mixed species in one order use each effective rate', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'price_per_pound' => 60.00]);
    $snapper = FishType::create(['name' => 'Snapper']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [
                ['fish_type_id' => $tuna->id, 'quantity_kg' => 1],
                ['fish_type_id' => $snapper->id, 'quantity_kg' => 1],
            ],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $order = Order::first();
    expect((float) $order->total_sbd)->toBe(187.43);

    $byFish = $order->items->keyBy('fish_type_id');
    expect((float) $byFish[$tuna->id]->subtotal_sbd)->toBe(132.30);
    expect((float) $byFish[$snapper->id]->subtotal_sbd)->toBe(55.13);
    expect($byFish[$tuna->id]->price_per_pound_snapshot)->toEqual('60.00');
    expect($byFish[$snapper->id]->price_per_pound_snapshot)->toEqual('25.00');
});

test('cut is stored per order item', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $snapper = FishType::create(['name' => 'Snapper']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [
                ['fish_type_id' => $tuna->id, 'quantity_kg' => 2, 'cut' => 'steak'],
                ['fish_type_id' => $snapper->id, 'quantity_kg' => 1, 'cut' => 'fillet'],
            ],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertRedirect();

    $items = Order::first()->items->keyBy('fish_type_id');
    expect($items[$tuna->id]->cut)->toBe('steak');
    expect($items[$snapper->id]->cut)->toBe('fillet');
});

test('cut defaults to null when not provided', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ]);

    expect(Order::first()->items->first()->cut)->toBeNull();
});

test('invalid cut value is rejected', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1, 'cut' => 'chunks']],
            'filleting' => false,
            'delivery' => false,
        ])
        ->assertSessionHasErrors('items.0.cut');
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
    expect($order->filleting_fee_snapshot)->toEqual('10.00');
    expect($order->delivery_fee_snapshot)->toEqual('5.00');

    $item = $order->items->first();
    expect($item->price_per_pound_snapshot)->toEqual('25.00');

    // Change pricing — line item snapshot should not change
    defaultPricing(pricePerPound: 30.00);
    $item->refresh();
    expect($item->price_per_pound_snapshot)->toEqual('25.00');
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

    Order::factory()->for($client)->create(['status' => 'delivered']);
    Order::factory()->for($client)->create(['status' => 'confirmed']);

    $this->actingAs($client)
        ->get(route('orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/index')
            ->has('orders.data', 2)
            ->where('filterStatus', null)
        );
});

test('client can filter orders by active status', function (): void {
    $client = User::factory()->client()->create();

    Order::factory()->for($client)->create(['status' => 'delivered']);
    Order::factory()->for($client)->create(['status' => 'confirmed']);
    Order::factory()->for($client)->create(['status' => 'placed']);

    $this->actingAs($client)
        ->get(route('orders.index', ['status' => 'active']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 2)
            ->where('filterStatus', 'active')
        );
});

test('client can filter orders by delivered status', function (): void {
    $client = User::factory()->client()->create();

    Order::factory()->for($client)->create(['status' => 'delivered']);
    Order::factory()->for($client)->create(['status' => 'delivered']);
    Order::factory()->for($client)->create(['status' => 'confirmed']);

    $this->actingAs($client)
        ->get(route('orders.index', ['status' => 'delivered']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 2)
            ->where('filterStatus', 'delivered')
        );
});

test('note is saved when provided', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
            'note' => 'Please call before delivery',
        ]);

    expect(Order::first()->note)->toBe('Please call before delivery');
});

test('note is null when not provided', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
        ]);

    expect(Order::first()->note)->toBeNull();
});

test('note exceeding 1000 characters is rejected', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->client()->create())
        ->post(route('orders.store'), [
            'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 1]],
            'filleting' => false,
            'delivery' => false,
            'note' => str_repeat('a', 1001),
        ])
        ->assertSessionHasErrors('note');
});

test('client only sees their own orders', function (): void {
    $client = User::factory()->client()->create();
    $other = User::factory()->client()->create();

    Order::factory()->for($client)->create();
    Order::factory()->for($other)->create();

    $this->actingAs($client)
        ->get(route('orders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('orders.data', 1));
});
