<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PricingUpdateRequest;
use App\Models\FishType;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function edit(): Response
    {
        $pricing = PricingConfig::current();

        return Inertia::render('admin/pricing', [
            'pricing' => [
                'price_per_pound' => $pricing->pricePerPound,
                'filleting_fee' => $pricing->filletingFee,
                'delivery_fee' => $pricing->deliveryFee,
                'kg_to_lbs_rate' => $pricing->kgToLbsRate,
            ],
            'discount' => DiscountConfig::current()->toInertiaProps(),
            'tax' => TaxConfig::current()->toInertiaProps(),
            'fishSpecies' => FishType::query()->orderBy('name')->get(['id', 'name', 'is_active', 'price_per_pound']),
        ]);
    }

    public function update(PricingUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();

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

        return to_route('admin.pricing.edit')->with('status', 'pricing-updated');
    }
}
