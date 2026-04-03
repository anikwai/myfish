<?php

namespace App\Pricing;

use App\Enums\WeightUnit;
use App\Models\FishType;
use App\Values\PricingConfig;
use Illuminate\Support\Collection;

final class FishOrderLinesCalculator
{
    /**
     * @param  array<int, array{fish_type_id: int, quantity_kg: float, cut?: string|null}>  $items
     * @param  Collection<int, FishType>  $fishTypes
     * @return array{lines: array<int, array<string, mixed>>, fish_subtotal: float}
     */
    public function calculate(array $items, Collection $fishTypes, PricingConfig $pricing): array
    {
        $lines = [];
        $fishSubtotal = 0.0;

        foreach ($items as $item) {
            $fishType = $fishTypes->get((int) $item['fish_type_id']);
            if ($fishType === null) {
                throw new \InvalidArgumentException("Unknown fish_type_id {$item['fish_type_id']}");
            }

            $pricePerPound = $fishType->effectivePrice((float) $pricing->pricePerPound);
            $pounds = round(WeightUnit::Kg->convertTo(WeightUnit::Lbs, $item['quantity_kg'], $pricing->kgToLbsRate), 3);
            $subtotal = round($pounds * $pricePerPound, 2);
            $fishSubtotal += $subtotal;

            $lines[] = [
                'fish_type_id' => $item['fish_type_id'],
                'cut' => $item['cut'] ?? null,
                'quantity_kg' => $item['quantity_kg'],
                'quantity_pounds' => $pounds,
                'kg_to_lbs_rate_snapshot' => $pricing->kgToLbsRate,
                'subtotal_sbd' => $subtotal,
                'price_per_pound_snapshot' => $pricePerPound,
            ];
        }

        return [
            'lines' => $lines,
            'fish_subtotal' => $fishSubtotal,
        ];
    }
}
