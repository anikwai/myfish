<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);

    defaultPricing();

    Inventory::current()->update(['stock_kg' => 500]);
});

// ── Placement logs ────────────────────────────────────────────────────────────

test('placing an order for a user creates a placed log entry', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);
    $client = User::factory()->client()->create();

    $this->actingAs($client)->postJson(route('orders.store'), [
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
        'delivery_location' => null,
    ]);

    $order = Order::where('user_id', $client->id)->first();

    expect($order->statusLogs)->toHaveCount(1)
        ->and($order->statusLogs->first()->status)->toBe('placed')
        ->and($order->statusLogs->first()->user_id)->toBeNull();
});

test('placing a guest order creates a placed log entry', function (): void {
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->postJson(route('guest-orders.store'), [
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
        'delivery_location' => null,
        'guest_name' => 'Jane',
        'guest_email' => 'jane@example.com',
        'guest_phone' => '+677 12345',
    ]);

    $order = Order::where('guest_email', 'jane@example.com')->first();

    expect($order->statusLogs)->toHaveCount(1)
        ->and($order->statusLogs->first()->status)->toBe('placed')
        ->and($order->statusLogs->first()->user_id)->toBeNull();
});

// ── Transition logs ───────────────────────────────────────────────────────────

test('transitionTo creates a log entry with the new status', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    $order->transitionTo('confirmed');

    expect(OrderStatusLog::where('order_id', $order->id)->where('status', 'confirmed')->exists())->toBeTrue();
});

test('transitionTo records the acting user on the log entry', function (): void {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => 'placed']);

    $order->transitionTo('confirmed', null, $admin);

    $log = OrderStatusLog::where('order_id', $order->id)->where('status', 'confirmed')->first();

    expect($log->user_id)->toBe($admin->id);
});

// ── Backfill ──────────────────────────────────────────────────────────────────

test('orders without log entries are backfilled with placed and current-status entries', function (): void {
    $placed = Order::factory()->create(['status' => 'placed']);
    $confirmed = Order::factory()->create(['status' => 'confirmed']);

    // Simulate pre-feature orders: delete any logs created by the factory/creator
    DB::table('order_status_logs')->truncate();

    $migration = include database_path('migrations/2026_04_02_000035_backfill_order_status_logs.php');
    $migration->up();

    expect($placed->statusLogs()->count())->toBe(1)
        ->and($placed->statusLogs()->first()->status)->toBe('placed')
        ->and($confirmed->statusLogs()->count())->toBe(2)
        ->and($confirmed->statusLogs()->pluck('status')->all())->toBe(['placed', 'confirmed']);
});

test('orders that already have log entries are not touched by the backfill', function (): void {
    // Factory creates a placed log via afterCreating
    $order = Order::factory()->create(['status' => 'confirmed']);
    $countBefore = $order->statusLogs()->count();

    $migration = include database_path('migrations/2026_04_02_000035_backfill_order_status_logs.php');
    $migration->up();

    expect($order->statusLogs()->count())->toBe($countBefore);
});

test('admin status update endpoint passes the acting user to the log', function (): void {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => 'placed']);

    $this->actingAs($admin)->patch(route('admin.orders.update-status', $order), [
        'status' => 'confirmed',
    ]);

    $log = OrderStatusLog::where('order_id', $order->id)->where('status', 'confirmed')->first();

    expect($log->user_id)->toBe($admin->id);
});

// ── Controller prop shapes ────────────────────────────────────────────────────

test('customer order show page returns statusLogs without actor', function (): void {
    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'placed']);

    $this->actingAs($client)
        ->get(route('orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/show')
            ->has('statusLogs', 1)
            ->where('statusLogs.0.status', 'placed')
            ->has('statusLogs.0.timestamp')
            ->missing('statusLogs.0.actor')
        );
});

test('guest confirmation page returns statusLogs without actor', function (): void {
    $order = Order::factory()->create([
        'status' => 'placed',
        'guest_name' => 'Jane',
        'guest_email' => 'jane@example.com',
        'guest_phone' => '+677 12345',
    ]);

    $signedUrl = URL::signedRoute('guest-orders.show', ['order' => $order->id]);

    $this->get($signedUrl)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/guest-confirmation')
            ->has('statusLogs', 1)
            ->where('statusLogs.0.status', 'placed')
            ->has('statusLogs.0.timestamp')
            ->missing('statusLogs.0.actor')
        );
});

test('admin order show page returns statusLogs with actor name', function (): void {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => 'placed']);
    $order->transitionTo('confirmed', null, $admin);

    $this->actingAs($admin)
        ->get(route('admin.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->has('statusLogs', 2)
            ->where('statusLogs.1.status', 'confirmed')
            ->where('statusLogs.1.actor', $admin->name)
        );
});
