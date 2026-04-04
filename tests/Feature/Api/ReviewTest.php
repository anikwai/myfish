<?php

use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RoleSeeder;

use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
});

// POST /api/v1/orders/{order}/review

it('creates a review for a delivered order', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);

    postJson("/api/v1/orders/{$order->id}/review", ['rating' => 5, 'comment' => 'Great fish!'], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'attributes' => ['rating', 'comment', 'reviewer_name', 'created_at']]]);

    $this->assertDatabaseHas('reviews', ['order_id' => $order->id, 'rating' => 5]);
});

it('creates a review without a comment', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);

    postJson("/api/v1/orders/{$order->id}/review", ['rating' => 3], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertCreated();
});

it('returns 401 for unauthenticated requests', function (): void {
    $order = Order::factory()->create(['status' => 'delivered']);

    postJson("/api/v1/orders/{$order->id}/review", ['rating' => 5])
        ->assertUnauthorized();
});

it('returns 403 if the order does not belong to the authenticated user', function (): void {
    $user = User::factory()->client()->create();
    $otherOrder = Order::factory()->create(['status' => 'delivered']);

    postJson("/api/v1/orders/{$otherOrder->id}/review", ['rating' => 4], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertForbidden();
});

it('returns 422 if the order is not in delivered status', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

    postJson("/api/v1/orders/{$order->id}/review", ['rating' => 5], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order']);
});

it('returns 422 if a review already exists for the order', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);
    Review::factory()->create(['order_id' => $order->id]);

    postJson("/api/v1/orders/{$order->id}/review", ['rating' => 5], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order']);
});

it('returns 422 for missing rating', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);

    postJson("/api/v1/orders/{$order->id}/review", [], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rating']);
});

it('returns 422 for a rating out of range', function (): void {
    $user = User::factory()->client()->create();
    $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'delivered']);

    postJson("/api/v1/orders/{$order->id}/review", ['rating' => 6], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rating']);
});
