<?php

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

test('guests are redirected from pricing page', function (): void {
    $this->get(route('admin.pricing.edit'))
        ->assertRedirect(route('login'));
});

test('clients cannot access the pricing page', function (): void {
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->get(route('admin.pricing.edit'))
        ->assertForbidden();
});

test('staff cannot access the pricing page', function (): void {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.pricing.edit'))
        ->assertForbidden();
});

test('admin can view pricing page with current values', function (): void {
    $admin = User::factory()->admin()->create();

    Setting::set('price_per_pound', 25.00);
    Setting::set('filleting_fee', 10.00);
    Setting::set('delivery_fee', 5.00);

    $this->actingAs($admin)
        ->get(route('admin.pricing.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/pricing')
            ->where('pricing.price_per_pound', 25)
            ->where('pricing.filleting_fee', 10)
            ->where('pricing.delivery_fee', 5)
        );
});

test('admin can update pricing settings', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 30.00,
            'filleting_fee' => 15.00,
            'delivery_fee' => 8.00,
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    expect(Setting::get('price_per_pound'))->toBe(30.0);
    expect(Setting::get('filleting_fee'))->toBe(15.0);
    expect(Setting::get('delivery_fee'))->toBe(8.0);
});

test('pricing update requires positive numeric values', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => -5,
            'filleting_fee' => 'abc',
            'delivery_fee' => '',
        ])
        ->assertSessionHasErrors(['price_per_pound', 'filleting_fee', 'delivery_fee']);
});

test('clients cannot update pricing settings', function (): void {
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 30.00,
            'filleting_fee' => 15.00,
            'delivery_fee' => 8.00,
        ])
        ->assertForbidden();
});

test('staff cannot update pricing settings', function (): void {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 30.00,
            'filleting_fee' => 15.00,
            'delivery_fee' => 8.00,
        ])
        ->assertForbidden();
});
