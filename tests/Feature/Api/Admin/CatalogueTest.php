<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\User;
use Database\Seeders\RoleSeeder;

use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
});

function adminAuthToken(): array
{
    return ['Authorization' => 'Bearer '.User::factory()->admin()->create()->createToken('test')->plainTextToken];
}

function staffAuthToken(): array
{
    return ['Authorization' => 'Bearer '.User::factory()->staff()->create()->createToken('test')->plainTextToken];
}

function clientAuthToken(): array
{
    return ['Authorization' => 'Bearer '.User::factory()->client()->create()->createToken('test')->plainTextToken];
}

// --- Fish Types ---

it('lists all fish types for admin', function (): void {
    FishType::factory()->count(3)->create();

    getJson('/api/v1/admin/fish-types', adminAuthToken())
        ->assertOk()
        ->assertJsonStructure(['data']);
});

it('returns 403 for staff on fish type list', function (): void {
    getJson('/api/v1/admin/fish-types', staffAuthToken())->assertForbidden();
});

it('returns 403 for client on fish type list', function (): void {
    getJson('/api/v1/admin/fish-types', clientAuthToken())->assertForbidden();
});

it('creates a fish type', function (): void {
    postJson('/api/v1/admin/fish-types', ['name' => 'Snapper', 'price_per_pound' => 12.50, 'is_active' => true], adminAuthToken())
        ->assertCreated()
        ->assertJsonPath('data.attributes.name', 'Snapper');

    $this->assertDatabaseHas('fish_types', ['name' => 'Snapper']);
});

it('returns 422 when creating a fish type without a name', function (): void {
    postJson('/api/v1/admin/fish-types', ['is_active' => true], adminAuthToken())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('updates a fish type name and price', function (): void {
    $fishType = FishType::factory()->create(['name' => 'Old Name', 'price_per_pound' => 10.0]);

    patchJson("/api/v1/admin/fish-types/{$fishType->id}", ['name' => 'New Name', 'price_per_pound' => 15.0], adminAuthToken())
        ->assertOk()
        ->assertJsonPath('data.attributes.name', 'New Name');

    expect($fishType->fresh()->name)->toBe('New Name');
});

it('toggles active state of a fish type', function (): void {
    $fishType = FishType::factory()->create(['is_active' => true]);

    patchJson("/api/v1/admin/fish-types/{$fishType->id}", ['is_active' => false], adminAuthToken())
        ->assertOk();

    expect($fishType->fresh()->is_active)->toBeFalse();
});

it('deletes a fish type', function (): void {
    $fishType = FishType::factory()->create();

    deleteJson("/api/v1/admin/fish-types/{$fishType->id}", [], adminAuthToken())
        ->assertNoContent();

    $this->assertDatabaseMissing('fish_types', ['id' => $fishType->id]);
});

// --- Inventory ---

it('returns current inventory and recent adjustments', function (): void {
    Inventory::create(['stock_kg' => 50.0]);

    getJson('/api/v1/admin/inventory', adminAuthToken())
        ->assertOk()
        ->assertJsonStructure(['stock_kg', 'adjustments']);
});

it('returns 403 for staff on inventory', function (): void {
    getJson('/api/v1/admin/inventory', staffAuthToken())->assertForbidden();
});

it('applies an inventory adjustment', function (): void {
    Inventory::create(['stock_kg' => 20.0]);

    postJson('/api/v1/admin/inventory/adjustments', ['delta_kg' => 5.0, 'reason' => 'Restock'], adminAuthToken())
        ->assertOk()
        ->assertJsonPath('stock_kg', 25);
});

it('returns 422 for zero delta inventory adjustment', function (): void {
    postJson('/api/v1/admin/inventory/adjustments', ['delta_kg' => 0, 'reason' => 'Nothing'], adminAuthToken())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['delta_kg']);
});

// --- Pricing ---

it('returns current pricing config', function (): void {
    getJson('/api/v1/admin/pricing', adminAuthToken())
        ->assertOk()
        ->assertJsonStructure(['pricing' => ['price_per_pound', 'filleting_fee', 'delivery_fee', 'kg_to_lbs_rate'], 'discount', 'tax']);
});

it('returns 403 for staff on pricing', function (): void {
    getJson('/api/v1/admin/pricing', staffAuthToken())->assertForbidden();
});

it('updates pricing config', function (): void {
    patchJson('/api/v1/admin/pricing', [
        'price_per_pound' => 12.0,
        'filleting_fee' => 6.0,
        'delivery_fee' => 4.0,
        'kg_to_lbs_rate' => 2.20462,
    ], adminAuthToken())
        ->assertOk()
        ->assertJsonPath('pricing.price_per_pound', 12);
});

it('returns 422 when pricing update is missing required fields', function (): void {
    patchJson('/api/v1/admin/pricing', ['price_per_pound' => 10.0], adminAuthToken())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['filleting_fee', 'delivery_fee', 'kg_to_lbs_rate']);
});
