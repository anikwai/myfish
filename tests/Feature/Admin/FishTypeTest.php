<?php

use App\Models\FishType;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

test('admin can view fish types page', function (): void {
    FishType::create(['name' => 'Tuna']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.fish-types.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/fish-types')
            ->missing('fishTypes')
            ->loadDeferredProps(fn ($reload) => $reload
                ->has('fishTypes.data', 1)
                ->where('fishTypes.total', 1)
                ->where('fishTypes.current_page', 1)
            )
        );
});

test('clients cannot access fish types admin page', function (): void {
    $this->actingAs(User::factory()->client()->create())
        ->get(route('admin.fish-types.index'))
        ->assertForbidden();
});

test('admin can create a fish type', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.fish-types.store'), ['name' => 'Snapper'])
        ->assertRedirect(route('admin.fish-types.index'))
        ->assertSessionHasNoErrors();

    $fishType = FishType::first();
    expect($fishType->name)->toBe('Snapper');
    expect($fishType->is_active)->toBeTrue();
});

test('admin can deactivate a fish type', function (): void {
    $fishType = FishType::create(['name' => 'Tuna', 'is_active' => true]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.fish-types.update', $fishType), ['is_active' => false])
        ->assertRedirect(route('admin.fish-types.index'))
        ->assertSessionHasNoErrors();

    expect($fishType->fresh()->is_active)->toBeFalse();
});

test('admin can reactivate a fish type', function (): void {
    $fishType = FishType::create(['name' => 'Tuna', 'is_active' => false]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.fish-types.update', $fishType), ['is_active' => true])
        ->assertRedirect(route('admin.fish-types.index'));

    expect($fishType->fresh()->is_active)->toBeTrue();
});

test('admin can rename a fish type', function (): void {
    $fishType = FishType::create(['name' => 'Tuna', 'is_active' => true]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.fish-types.update', $fishType), ['name' => 'Yellowfin Tuna'])
        ->assertRedirect(route('admin.fish-types.index'))
        ->assertSessionHasNoErrors();

    expect($fishType->fresh()->name)->toBe('Yellowfin Tuna');
});

test('fish type name is required', function (): void {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.fish-types.store'), ['name' => ''])
        ->assertSessionHasErrors('name');
});
