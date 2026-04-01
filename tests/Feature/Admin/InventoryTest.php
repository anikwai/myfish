<?php

use App\Models\Inventory;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

test('guests are redirected from inventory page', function (): void {
    $this->get(route('admin.inventory.index'))
        ->assertRedirect(route('login'));
});

test('clients cannot access inventory page', function (): void {
    $this->actingAs(User::factory()->client()->create())
        ->get(route('admin.inventory.index'))
        ->assertForbidden();
});

test('staff cannot access inventory page', function (): void {
    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.inventory.index'))
        ->assertForbidden();
});

test('admin can view inventory page with stock levels', function (): void {
    $admin = User::factory()->admin()->create();

    $inventory = Inventory::current();
    $inventory->stock_kg = 100;
    $inventory->save();

    $this->actingAs($admin)
        ->get(route('admin.inventory.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/inventory')
            ->where('stock_kg', 100)
            ->has('adjustments')
        );
});

test('admin can add stock with a positive adjustment', function (): void {
    $admin = User::factory()->admin()->create();

    $inventory = Inventory::current();
    $inventory->stock_kg = 50;
    $inventory->save();

    $this->actingAs($admin)
        ->post(route('admin.inventory.adjust'), [
            'delta_kg' => 30,
            'reason' => 'New delivery arrived',
        ])
        ->assertRedirect(route('admin.inventory.index'))
        ->assertSessionHasNoErrors();

    expect(Inventory::current()->stock_kg)->toEqual('80.000');
});

test('admin can reduce stock with a negative adjustment', function (): void {
    $admin = User::factory()->admin()->create();

    $inventory = Inventory::current();
    $inventory->stock_kg = 50;
    $inventory->save();

    $this->actingAs($admin)
        ->post(route('admin.inventory.adjust'), [
            'delta_kg' => -10,
            'reason' => 'Stock correction after count',
        ])
        ->assertRedirect(route('admin.inventory.index'))
        ->assertSessionHasNoErrors();

    expect(Inventory::current()->stock_kg)->toEqual('40.000');
});

test('adjustment is recorded in the log', function (): void {
    $admin = User::factory()->admin()->create();

    Inventory::current();

    $this->actingAs($admin)
        ->post(route('admin.inventory.adjust'), [
            'delta_kg' => 25.5,
            'reason' => 'Weekly delivery',
        ]);

    $inventory = Inventory::with('adjustments')->first();

    expect($inventory->adjustments)->toHaveCount(1);

    $adjustment = $inventory->adjustments->first();
    expect($adjustment->type)->toBe('manual');
    expect($adjustment->delta_kg)->toEqual('25.500');
    expect($adjustment->reason)->toBe('Weekly delivery');
    expect($adjustment->user_id)->toBe($admin->id);
});

test('adjustment requires a reason', function (): void {
    $admin = User::factory()->admin()->create();

    Inventory::current();

    $this->actingAs($admin)
        ->post(route('admin.inventory.adjust'), [
            'delta_kg' => 10,
            'reason' => '',
        ])
        ->assertSessionHasErrors('reason');
});

test('adjustment delta cannot be zero', function (): void {
    $admin = User::factory()->admin()->create();

    Inventory::current();

    $this->actingAs($admin)
        ->post(route('admin.inventory.adjust'), [
            'delta_kg' => 0,
            'reason' => 'Nothing',
        ])
        ->assertSessionHasErrors('delta_kg');
});

test('clients cannot post adjustments', function (): void {
    Inventory::current();

    $this->actingAs(User::factory()->client()->create())
        ->post(route('admin.inventory.adjust'), [
            'delta_kg' => 10,
            'reason' => 'Hack',
        ])
        ->assertForbidden();
});
