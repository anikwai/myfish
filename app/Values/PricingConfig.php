<?php

namespace App\Values;

use App\Models\Setting;

final readonly class PricingConfig
{
    public function __construct(
        public float $pricePerPound,
        public float $filletingFee,
        public float $deliveryFee,
    ) {}

    public static function current(): self
    {
        return new self(
            pricePerPound: Setting::get('price_per_pound'),
            filletingFee: Setting::get('filleting_fee'),
            deliveryFee: Setting::get('delivery_fee'),
        );
    }

    public static function set(float $pricePerPound, float $filletingFee, float $deliveryFee): void
    {
        Setting::set('price_per_pound', $pricePerPound);
        Setting::set('filleting_fee', $filletingFee);
        Setting::set('delivery_fee', $deliveryFee);
    }
}
