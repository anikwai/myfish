<?php

use App\Enums\DiscountMode;
use App\Enums\TaxMode;
use App\Models\FishType;
use App\Models\User;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
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

    defaultPricing();

    $this->actingAs($admin)
        ->get(route('admin.pricing.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/pricing')
            ->where('pricing.price_per_pound', 25)
            ->where('pricing.filleting_fee', 10)
            ->where('pricing.delivery_fee', 5)
            ->where('pricing.kg_to_lbs_rate', 2.20462)
            ->where('discount.mode', 'off')
            ->where('tax.mode', 'off')
            ->where('tax.label', 'Tax')
            ->has('fishSpecies')
        );
});

test('admin can update pricing settings', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 30.00,
            'filleting_fee' => 15.00,
            'delivery_fee' => 8.00,
            'kg_to_lbs_rate' => 2.20462,
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    $pricing = PricingConfig::current();
    expect($pricing->pricePerPound)->toBe(30.0);
    expect($pricing->filletingFee)->toBe(15.0);
    expect($pricing->deliveryFee)->toBe(8.0);
    expect($pricing->kgToLbsRate)->toBe(2.20462);
});

test('admin can update order discount settings', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 25.00,
            'filleting_fee' => 10.00,
            'delivery_fee' => 5.00,
            'kg_to_lbs_rate' => 2.20462,
            'discount_mode' => 'fixed',
            'discount_fixed_sbd' => 12.50,
            'discount_percent' => 0,
            'discount_max_sbd' => null,
            'discount_min_order_sbd' => null,
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    $discount = DiscountConfig::current();
    expect($discount->mode)->toBe(DiscountMode::Fixed);
    expect($discount->fixedSbd)->toBe(12.5);
});

test('admin can update sales tax settings', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 25.00,
            'filleting_fee' => 10.00,
            'delivery_fee' => 5.00,
            'kg_to_lbs_rate' => 2.20462,
            'discount_mode' => 'off',
            'discount_fixed_sbd' => 0,
            'discount_percent' => 0,
            'discount_max_sbd' => null,
            'discount_min_order_sbd' => null,
            'tax_mode' => 'percent',
            'tax_percent' => 15,
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    $tax = TaxConfig::current();
    expect($tax->mode)->toBe(TaxMode::Percent);
    expect($tax->percent)->toBe(15.0);
});

test('admin can update customer-facing tax label', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 25.00,
            'filleting_fee' => 10.00,
            'delivery_fee' => 5.00,
            'kg_to_lbs_rate' => 2.20462,
            'discount_mode' => 'off',
            'discount_fixed_sbd' => 0,
            'discount_percent' => 0,
            'discount_max_sbd' => null,
            'discount_min_order_sbd' => null,
            'tax_mode' => 'percent',
            'tax_percent' => 10,
            'tax_label' => 'GST',
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    expect(TaxConfig::current()->label)->toBe('GST');
});

test('pricing update without tax_label preserves stored label', function (): void {
    $admin = User::factory()->admin()->create();

    TaxConfig::saveFromValidated([
        'tax_mode' => 'percent',
        'tax_percent' => 10,
        'tax_label' => 'GST',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 30.00,
            'filleting_fee' => 10.00,
            'delivery_fee' => 5.00,
            'kg_to_lbs_rate' => 2.20462,
            'discount_mode' => 'off',
            'discount_fixed_sbd' => 0,
            'discount_percent' => 0,
            'discount_max_sbd' => null,
            'discount_min_order_sbd' => null,
            'tax_mode' => 'percent',
            'tax_percent' => 15,
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    $tax = TaxConfig::current();
    expect($tax->percent)->toBe(15.0);
    expect($tax->label)->toBe('GST');
});

test('admin can save per-species price overrides', function (): void {
    $admin = User::factory()->admin()->create();
    $tuna = FishType::create(['name' => 'Tuna']);

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 25.00,
            'filleting_fee' => 10.00,
            'delivery_fee' => 5.00,
            'kg_to_lbs_rate' => 2.20462,
            'species_prices' => [(string) $tuna->id => 42.50],
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    expect($tuna->fresh()->price_per_pound)->toEqual('42.50');
});

test('admin can clear per-species override to use global rate', function (): void {
    $admin = User::factory()->admin()->create();
    $tuna = FishType::create(['name' => 'Tuna', 'price_per_pound' => 99.00]);

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => 25.00,
            'filleting_fee' => 10.00,
            'delivery_fee' => 5.00,
            'kg_to_lbs_rate' => 2.20462,
            'species_prices' => [(string) $tuna->id => null],
        ])
        ->assertRedirect(route('admin.pricing.edit'))
        ->assertSessionHasNoErrors();

    expect($tuna->fresh()->price_per_pound)->toBeNull();
});

test('pricing update requires positive numeric values', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.pricing.update'), [
            'price_per_pound' => -5,
            'filleting_fee' => 'abc',
            'delivery_fee' => '',
        ])
        ->assertSessionHasErrors(['price_per_pound', 'filleting_fee', 'delivery_fee', 'kg_to_lbs_rate']);
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
