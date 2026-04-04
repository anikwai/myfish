<?php

use App\Models\FishType;
use App\Models\Order;
use Database\Seeders\RoleSeeder;

use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
});

// Helpers

function guestPayload(FishType $fishType, array $overrides = []): array
{
    return array_merge([
        'guest_name' => 'John Guest',
        'guest_email' => 'guest@example.com',
        'guest_phone' => '+677 12345',
        'items' => [
            ['fish_type_id' => $fishType->id, 'quantity_kg' => 1.5],
        ],
        'filleting' => false,
        'delivery' => false,
    ], $overrides);
}

// POST /api/v1/orders/guest

it('creates a guest order and returns the order with a tracking token', function (): void {
    $fishType = FishType::factory()->create();

    $response = postJson('/api/v1/orders/guest', guestPayload($fishType))
        ->assertCreated()
        ->assertJsonStructure(['data', 'meta' => ['tracking_token']]);

    expect($response->json('meta.tracking_token'))->toBeString()->not->toBeEmpty();
    $this->assertDatabaseHas('orders', ['guest_email' => 'guest@example.com', 'status' => 'placed']);
});

it('returns full order with items and status logs on creation', function (): void {
    $fishType = FishType::factory()->create();

    postJson('/api/v1/orders/guest', guestPayload($fishType))
        ->assertCreated()
        ->assertJsonStructure([
            'data' => [
                'id',
                'attributes' => ['status', 'total_sbd'],
                'relationships' => ['items', 'statusLogs'],
            ],
            'included',
            'meta' => ['tracking_token'],
        ]);
});

it('does not require authentication to create a guest order', function (): void {
    $fishType = FishType::factory()->create();

    postJson('/api/v1/orders/guest', guestPayload($fishType))
        ->assertCreated();
});

it('returns validation errors when guest_name is missing', function (): void {
    $fishType = FishType::factory()->create();

    postJson('/api/v1/orders/guest', guestPayload($fishType, ['guest_name' => null]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['guest_name']);
});

it('returns validation errors when guest_phone is missing', function (): void {
    $fishType = FishType::factory()->create();

    postJson('/api/v1/orders/guest', guestPayload($fishType, ['guest_phone' => null]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['guest_phone']);
});

// GET /api/v1/orders/guest/{order}

it('returns order detail for a valid tracking token', function (): void {
    $fishType = FishType::factory()->create();

    $storeResponse = postJson('/api/v1/orders/guest', guestPayload($fishType))
        ->assertCreated();

    $trackingToken = $storeResponse->json('meta.tracking_token');
    $orderId = $storeResponse->json('data.id');

    getJson("/api/v1/orders/guest/{$orderId}?signature={$trackingToken}")
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'attributes' => ['status', 'total_sbd'],
                'relationships' => ['items', 'statusLogs'],
            ],
            'included',
        ]);
});

it('returns 403 for a missing tracking token', function (): void {
    $order = Order::factory()->create(['guest_email' => 'guest@example.com']);

    getJson("/api/v1/orders/guest/{$order->id}")
        ->assertForbidden();
});

it('returns 403 for an invalid tracking token', function (): void {
    $order = Order::factory()->create(['guest_email' => 'guest@example.com']);

    getJson("/api/v1/orders/guest/{$order->id}?signature=invalid-token")
        ->assertForbidden();
});

it('does not require authentication to view a guest order', function (): void {
    $fishType = FishType::factory()->create();

    $storeResponse = postJson('/api/v1/orders/guest', guestPayload($fishType))
        ->assertCreated();

    $trackingToken = $storeResponse->json('meta.tracking_token');
    $orderId = $storeResponse->json('data.id');

    getJson("/api/v1/orders/guest/{$orderId}?signature={$trackingToken}")
        ->assertOk();
});
