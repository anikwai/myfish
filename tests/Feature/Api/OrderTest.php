<?php

use App\Models\FishType;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RoleSeeder;

use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

// Helpers

function orderPayload(FishType $fishType, array $overrides = []): array
{
    return array_merge([
        'items' => [
            ['fish_type_id' => $fishType->id, 'quantity_kg' => 2.5],
        ],
        'filleting' => false,
        'delivery' => false,
    ], $overrides);
}

// GET /api/v1/orders

it('returns a cursor-paginated list of orders for the authenticated user', function (): void {
    $user = User::factory()->create();
    Order::factory()->count(3)->create(['user_id' => $user->id]);

    getJson('/api/v1/orders', ['Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}"])
        ->assertOk()
        ->assertJsonStructure(['data', 'links', 'meta']);
});

it('does not return orders belonging to other users', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();
    Order::factory()->count(2)->create(['user_id' => $other->id]);

    $response = getJson('/api/v1/orders', ['Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}"])
        ->assertOk();

    expect($response->json('data'))->toBeEmpty();
});

it('filters orders by status=active', function (): void {
    $user = User::factory()->create();
    Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);
    Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);

    $response = getJson('/api/v1/orders?status=active', ['Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}"])
        ->assertOk();

    $statuses = collect($response->json('data'))->pluck('attributes.status');
    expect($statuses)->each->toBeIn(['placed', 'confirmed', 'on_hold', 'packed']);
});

it('filters orders by exact status', function (): void {
    $user = User::factory()->create();
    Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);
    Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);

    $response = getJson('/api/v1/orders?status=delivered', ['Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}"])
        ->assertOk();

    $statuses = collect($response->json('data'))->pluck('attributes.status');
    expect($statuses)->each->toBe('delivered');
});

it('returns 401 when listing orders without a token', function (): void {
    getJson('/api/v1/orders')->assertUnauthorized();
});

// POST /api/v1/orders

it('creates an order and returns the full order with items and status logs', function (): void {
    defaultPricing();
    $user = User::factory()->create();
    $fishType = FishType::factory()->create();

    $response = postJson(
        '/api/v1/orders',
        orderPayload($fishType),
        ['Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}"]
    )->assertCreated();

    $response->assertJsonStructure([
        'data' => [
            'id',
            'type',
            'attributes' => ['status', 'total_sbd'],
            'relationships' => ['items', 'statusLogs'],
        ],
        'included',
    ]);

    $this->assertDatabaseHas('orders', ['user_id' => $user->id, 'status' => 'placed']);
});

it('returns validation errors when creating an order with missing items', function (): void {
    $user = User::factory()->create();

    postJson('/api/v1/orders', ['filleting' => false, 'delivery' => false], [
        'Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}",
    ])->assertUnprocessable()->assertJsonValidationErrors(['items']);
});

it('requires delivery_location when delivery is true', function (): void {
    $user = User::factory()->create();
    $fishType = FishType::factory()->create();

    postJson('/api/v1/orders', orderPayload($fishType, ['delivery' => true, 'delivery_location' => null]), [
        'Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}",
    ])->assertUnprocessable()->assertJsonValidationErrors(['delivery_location']);
});

it('returns 401 when creating an order without a token', function (): void {
    postJson('/api/v1/orders', [])->assertUnauthorized();
});

// GET /api/v1/orders/{order}

it('returns full order detail including items and status logs', function (): void {
    defaultPricing();
    $user = User::factory()->create();
    $fishType = FishType::factory()->create();

    $createResponse = postJson(
        '/api/v1/orders',
        orderPayload($fishType),
        ['Authorization' => "Bearer {$user->createToken('mobile')->plainTextToken}"]
    )->assertCreated();

    $orderId = $createResponse->json('data.id');

    getJson("/api/v1/orders/{$orderId}", ['Authorization' => "Bearer {$user->createToken('test')->plainTextToken}"])
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'attributes' => ['status', 'total_sbd', 'filleting', 'delivery'],
                'relationships' => ['items', 'statusLogs'],
            ],
            'included',
        ]);
});

it('returns 403 when accessing another user\'s order', function (): void {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $order = Order::factory()->create(['user_id' => $owner->id]);

    getJson("/api/v1/orders/{$order->id}", ['Authorization' => "Bearer {$other->createToken('mobile')->plainTextToken}"])
        ->assertForbidden();
});

it('returns 401 when viewing an order without a token', function (): void {
    $order = Order::factory()->create(['user_id' => User::factory()->create()->id]);

    getJson("/api/v1/orders/{$order->id}")->assertUnauthorized();
});
