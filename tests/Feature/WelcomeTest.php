<?php

use App\Models\FishType;
use Database\Seeders\RoleSeeder;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
});

test('welcome page renders for guests', function (): void {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});

test('welcome page passes active fish types only', function (): void {
    FishType::create(['name' => 'Tuna', 'is_active' => true]);
    FishType::create(['name' => 'Shark', 'is_active' => false]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('fishTypes', 1)
            ->where('fishTypes.0.name', 'Tuna')
            ->where('fishTypes.0.price_per_pound', null)
        );
});

test('welcome page passes pricing', function (): void {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pricing.price_per_pound', 25)
            ->where('pricing.filleting_fee', 10)
            ->where('pricing.delivery_fee', 5)
            ->where('discount.mode', 'off')
            ->where('tax.mode', 'off')
            ->where('tax.label', 'Tax')
        );
});

test('welcome page passes canRegister flag', function (): void {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('canRegister'));
});
