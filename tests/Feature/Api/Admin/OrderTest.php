<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RoleSeeder;

use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
});

// Helpers

function adminToken(): array
{
    $admin = User::factory()->admin()->create();

    return ['Authorization' => 'Bearer '.$admin->createToken('test')->plainTextToken];
}

function staffToken(): array
{
    $staff = User::factory()->staff()->create();

    return ['Authorization' => 'Bearer '.$staff->createToken('test')->plainTextToken];
}

function clientToken(): array
{
    $client = User::factory()->client()->create();

    return ['Authorization' => 'Bearer '.$client->createToken('test')->plainTextToken];
}

// GET /api/v1/admin/orders

it('returns a paginated list of all orders for admin', function (): void {
    Order::factory()->count(3)->create();

    getJson('/api/v1/admin/orders', adminToken())
        ->assertOk()
        ->assertJsonStructure(['data']);
});

it('returns a paginated list of all orders for staff', function (): void {
    Order::factory()->count(2)->create();

    getJson('/api/v1/admin/orders', staffToken())
        ->assertOk();
});

it('filters orders by status', function (): void {
    Order::factory()->create(['status' => 'placed']);
    Order::factory()->create(['status' => 'delivered']);

    $response = getJson('/api/v1/admin/orders?status=placed', adminToken())
        ->assertOk();

    $statuses = collect($response->json('data'))->pluck('attributes.status')->unique()->values()->all();
    expect($statuses)->toBe(['placed']);
});

it('searches orders by guest name', function (): void {
    Order::factory()->create(['guest_name' => 'Kalinda Smith']);
    Order::factory()->create(['guest_name' => 'John Doe']);

    $response = getJson('/api/v1/admin/orders?search=Kalinda', adminToken())
        ->assertOk();

    expect($response->json('data'))->toHaveCount(1);
});

it('searches orders by ID', function (): void {
    $order = Order::factory()->create();

    $response = getJson("/api/v1/admin/orders?search={$order->id}", adminToken())
        ->assertOk();

    expect($response->json('data'))->toHaveCount(1);
});

it('returns 403 for non-admin/staff users on index', function (): void {
    getJson('/api/v1/admin/orders', clientToken())->assertForbidden();
});

it('returns 401 for unauthenticated requests on index', function (): void {
    getJson('/api/v1/admin/orders')->assertUnauthorized();
});

// GET /api/v1/admin/orders/{order}

it('returns full order detail with status logs and actor names', function (): void {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => 'placed']);

    $order->transitionTo('confirmed', actor: $admin);

    $token = ['Authorization' => 'Bearer '.$admin->createToken('test')->plainTextToken];

    getJson("/api/v1/admin/orders/{$order->id}", $token)
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['id', 'attributes', 'relationships'],
        ]);
});

it('returns 403 for non-admin/staff on show', function (): void {
    $order = Order::factory()->create();

    getJson("/api/v1/admin/orders/{$order->id}", clientToken())->assertForbidden();
});

// PATCH /api/v1/admin/orders/{order}/status

it('transitions order status', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'confirmed'], adminToken())
        ->assertOk()
        ->assertJsonPath('data.attributes.status', 'confirmed');

    expect($order->fresh()->status)->toBe('confirmed');
});

it('deducts inventory when transitioning to packed', function (): void {
    $fishType = FishType::factory()->create();
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => 'confirmed']);
    $order->items()->create([
        'fish_type_id' => $fishType->id,
        'quantity_kg' => 2.0,
        'quantity_pounds' => 4.41,
        'price_per_pound_snapshot' => 10.0,
        'subtotal_sbd' => 44.10,
    ]);

    Inventory::create(['stock_kg' => 10.0]);

    $token = ['Authorization' => 'Bearer '.$admin->createToken('test')->plainTextToken];

    patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'packed'], $token)
        ->assertOk();

    expect((float) Inventory::current()->stock_kg)->toBe(8.0);
});

it('returns 422 for an invalid status transition', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'delivered'], adminToken())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

it('returns 403 for non-admin/staff on status update', function (): void {
    $order = Order::factory()->create(['status' => 'placed']);

    patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'confirmed'], clientToken())
        ->assertForbidden();
});

// POST /api/v1/admin/orders/guest

it('creates a guest order as admin', function (): void {
    $fishType = FishType::factory()->create();

    postJson('/api/v1/admin/orders/guest', [
        'guest_name' => 'Walk-in Customer',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $fishType->id, 'quantity_kg' => 1.5]],
        'filleting' => false,
        'delivery' => false,
    ], adminToken())
        ->assertCreated()
        ->assertJsonPath('data.attributes.status', 'placed');
});

it('returns 403 for non-admin/staff on guest order creation', function (): void {
    $fishType = FishType::factory()->create();

    postJson('/api/v1/admin/orders/guest', [
        'guest_name' => 'Walk-in Customer',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $fishType->id, 'quantity_kg' => 1.5]],
        'filleting' => false,
        'delivery' => false,
    ], clientToken())
        ->assertForbidden();
});
