<?php

use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
});

function businessAdminToken(): array
{
    return ['Authorization' => 'Bearer '.User::factory()->admin()->create()->createToken('test')->plainTextToken];
}

function businessClientToken(): array
{
    return ['Authorization' => 'Bearer '.User::factory()->client()->create()->createToken('test')->plainTextToken];
}

// --- Business ---

it('returns current business settings', function (): void {
    getJson('/api/v1/admin/business', businessAdminToken())
        ->assertOk()
        ->assertJsonStructure(['name', 'address', 'phone', 'email', 'logo_url']);
});

it('updates business settings', function (): void {
    patchJson('/api/v1/admin/business', [
        'business_name' => 'My Fish Co',
        'business_address' => '123 Ocean Drive',
        'business_phone' => '+677 12345',
        'business_email' => 'info@fish.co',
    ], businessAdminToken())
        ->assertOk()
        ->assertJsonPath('name', 'My Fish Co');
});

it('returns 422 when business name is missing', function (): void {
    patchJson('/api/v1/admin/business', [], businessAdminToken())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['business_name']);
});

it('uploads a business logo', function (): void {
    Storage::fake('public');

    postJson('/api/v1/admin/business/logo', [
        'logo' => UploadedFile::fake()->image('logo.jpg', 200, 200),
    ], businessAdminToken())
        ->assertOk()
        ->assertJsonStructure(['logo_url']);
});

it('returns 422 when logo upload has no file', function (): void {
    postJson('/api/v1/admin/business/logo', [], businessAdminToken())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['logo']);
});

it('deletes the business logo', function (): void {
    deleteJson('/api/v1/admin/business/logo', [], businessAdminToken())
        ->assertNoContent();
});

it('returns 403 for non-admin on business endpoints', function (): void {
    getJson('/api/v1/admin/business', businessClientToken())->assertForbidden();
});

// --- Reports ---

it('returns report data for today by default', function (): void {
    getJson('/api/v1/admin/reports', businessAdminToken())
        ->assertOk()
        ->assertJsonStructure([
            'period', 'order_count', 'total_revenue',
            'total_kg', 'top_fish_types', 'stock_history',
        ]);
});

it('returns report data for a given period', function (): void {
    getJson('/api/v1/admin/reports?period=month', businessAdminToken())
        ->assertOk()
        ->assertJsonPath('period', 'month');
});

it('returns 403 for non-admin on reports', function (): void {
    getJson('/api/v1/admin/reports', businessClientToken())->assertForbidden();
});

// --- Reviews ---

it('returns all reviews with stats', function (): void {
    $order = Order::factory()->create(['status' => 'delivered']);
    Review::factory()->create(['order_id' => $order->id, 'rating' => 5]);

    getJson('/api/v1/admin/reviews', businessAdminToken())
        ->assertOk()
        ->assertJsonStructure(['data', 'stats' => ['average', 'total']]);
});

it('deletes a review', function (): void {
    $order = Order::factory()->create(['status' => 'delivered']);
    $review = Review::factory()->create(['order_id' => $order->id]);

    deleteJson("/api/v1/admin/reviews/{$review->id}", [], businessAdminToken())
        ->assertNoContent();

    $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
});

it('returns 403 for non-admin on reviews', function (): void {
    getJson('/api/v1/admin/reviews', businessClientToken())->assertForbidden();
});
