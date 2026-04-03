<?php

use App\Models\FishType;

test('effective price falls back to global when species price is null', function (): void {
    $fish = new FishType(['price_per_pound' => null]);

    expect($fish->effectivePrice(25.0))->toBe(25.0);
});

test('effective price uses species override when set', function (): void {
    $fish = new FishType(['price_per_pound' => 60.5]);

    expect($fish->effectivePrice(25.0))->toBe(60.5);
});
