<?php

namespace App\Http\Controllers\Admin;

use App\Actions\UpdatePricingSettings;
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
    public function __construct(private readonly UpdatePricingSettings $updatePricingSettings) {}

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
        $this->updatePricingSettings->handle($request->validated());

        return to_route('admin.pricing.edit')->with('status', 'pricing-updated');
    }
}
