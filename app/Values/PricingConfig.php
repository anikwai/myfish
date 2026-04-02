<?php

namespace App\Values;

use App\Models\Setting;

final readonly class PricingConfig
{
    public function __construct(
        public float $pricePerPound,
        public float $filletingFee,
        public float $deliveryFee,
        public float $kgToLbsRate,
    ) {}

    public static function current(): self
    {
        return new self(
            pricePerPound: Setting::get('price_per_pound'),
            filletingFee: Setting::get('filleting_fee'),
            deliveryFee: Setting::get('delivery_fee'),
            kgToLbsRate: Setting::get('kg_to_lbs_rate', 2.20462),
        );
    }

    public static function set(float $pricePerPound, float $filletingFee, float $deliveryFee, float $kgToLbsRate = 2.20462): void
    {
        Setting::set('price_per_pound', $pricePerPound);
        Setting::set('filleting_fee', $filletingFee);
        Setting::set('delivery_fee', $deliveryFee);
        Setting::set('kg_to_lbs_rate', $kgToLbsRate);
    }
}
