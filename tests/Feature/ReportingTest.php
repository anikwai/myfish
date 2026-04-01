<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);

    Setting::set('price_per_pound', 25.00);
    Setting::set('filleting_fee', 10.00);
    Setting::set('delivery_fee', 5.00);

    Inventory::current()->update(['stock_kg' => 500]);
});

// ── Access control ────────────────────────────────────────────────────────────

test('admin can access reports', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertOk();
});

test('staff cannot access reports', function (): void {
    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.reports.index'))
        ->assertForbidden();
});

test('client cannot access reports', function (): void {
    $this->actingAs(User::factory()->client()->create())
        ->get(route('admin.reports.index'))
        ->assertForbidden();
});

// ── Revenue aggregation ───────────────────────────────────────────────────────

test('report shows total revenue for period', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $order = Order::factory()->for($client)->create([
        'status' => 'confirmed',
        'total_sbd' => 110.00,
        'filleting' => true,
        'filleting_fee_snapshot' => 10.00,
        'delivery' => false,
        'delivery_fee_snapshot' => 5.00,
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'today']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('totalRevenue', 110)
            ->where('filletingRevenue', 10)
            ->where('deliveryRevenue', 0)
            ->where('orderCount', 1)
        );
});

test('rejected orders are excluded from revenue', function (): void {
    $client = User::factory()->client()->create();

    Order::factory()->for($client)->create(['status' => 'rejected', 'total_sbd' => 200.00]);
    Order::factory()->for($client)->create(['status' => 'confirmed', 'total_sbd' => 50.00]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'today']))
        ->assertInertia(fn ($page) => $page
            ->where('totalRevenue', 50)
            ->where('orderCount', 1)
        );
});

// ── Weight totals ─────────────────────────────────────────────────────────────

test('report shows total weight sold', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $order = Order::factory()->for($client)->create(['status' => 'confirmed']);
    $order->items()->create([
        'fish_type_id' => $tuna->id,
        'quantity_kg' => 10,
        'quantity_pounds' => 22.046,
        'subtotal_sbd' => 551.15,
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'today']))
        ->assertInertia(fn ($page) => $page
            ->where('totalKg', 10)
            ->where('totalPounds', 22.046)
        );
});

// ── Top fish types ────────────────────────────────────────────────────────────

test('report shows top fish types by order frequency', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $snapper = FishType::create(['name' => 'Snapper']);
    $client = User::factory()->client()->create();

    // Tuna ordered twice, snapper once
    foreach (range(1, 2) as $_) {
        $order = Order::factory()->for($client)->create(['status' => 'confirmed']);
        $order->items()->create([
            'fish_type_id' => $tuna->id,
            'quantity_kg' => 1,
            'quantity_pounds' => 2.20462,
            'subtotal_sbd' => 55.12,
        ]);
    }

    $order = Order::factory()->for($client)->create(['status' => 'confirmed']);
    $order->items()->create([
        'fish_type_id' => $snapper->id,
        'quantity_kg' => 1,
        'quantity_pounds' => 2.20462,
        'subtotal_sbd' => 55.12,
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'today']))
        ->assertInertia(fn ($page) => $page
            ->where('topFishTypes.0.name', 'Tuna')
            ->where('topFishTypes.0.order_count', 2)
            ->where('topFishTypes.1.name', 'Snapper')
            ->where('topFishTypes.1.order_count', 1)
        );
});

// ── Period filtering ──────────────────────────────────────────────────────────

test('period filter defaults to today', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertInertia(fn ($page) => $page->where('period', 'today'));
});

test('period can be set to week', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'week']))
        ->assertInertia(fn ($page) => $page->where('period', 'week'));
});

test('period can be set to month', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'month']))
        ->assertInertia(fn ($page) => $page->where('period', 'month'));
});

test('orders outside the selected period are excluded', function (): void {
    $client = User::factory()->client()->create();

    // Order created last month
    Order::factory()->for($client)->create([
        'status' => 'confirmed',
        'total_sbd' => 500.00,
        'created_at' => now()->subMonth(),
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index', ['period' => 'today']))
        ->assertInertia(fn ($page) => $page
            ->where('orderCount', 0)
            ->where('totalRevenue', 0)
        );
});
