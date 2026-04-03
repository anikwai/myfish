<?php

namespace App\Pricing;

use App\Models\FishType;
use App\Values\PricingConfig;
use Illuminate\Support\Collection;

/**
 * Inputs for a single pricing run (e.g. one checkout submission).
 *
 * @param  Collection<int, FishType>  $fishTypes  keyed by fish type id
 * @param  array<int, array{fish_type_id: int, quantity_kg: float, cut?: string|null}>  $items
 */
final readonly class PricingContext
{
    /**
     * @param  Collection<int, FishType>  $fishTypes
     * @param  array<int, array{fish_type_id: int, quantity_kg: float, cut?: string|null}>  $items
     */
    public function __construct(
        public PricingConfig $pricing,
        public array $items,
        public Collection $fishTypes,
        public bool $filleting,
        public bool $delivery,
    ) {}
}
