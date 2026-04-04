<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\FishType;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;

final readonly class UpdatePricingSettings
{
    public function handle(array $data): void
    {
        PricingConfig::set($data['price_per_pound'], $data['filleting_fee'], $data['delivery_fee'], $data['kg_to_lbs_rate']);
        DiscountConfig::saveFromValidated($data);
        TaxConfig::saveFromValidated($data);

        $validIds = FishType::pluck('id')->all();

        foreach ($data['species_prices'] ?? [] as $fishTypeId => $price) {
            $id = (int) $fishTypeId;

            if ($id < 1 || ! in_array($id, $validIds, true)) {
                continue;
            }

            FishType::query()->whereKey($id)->update([
                'price_per_pound' => $price === null ? null : round((float) $price, 2),
            ]);
        }
    }
}
