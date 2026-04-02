<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PricingUpdateRequest;
use App\Values\PricingConfig;
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
        ]);
    }

    public function update(PricingUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        PricingConfig::set($data['price_per_pound'], $data['filleting_fee'], $data['delivery_fee'], $data['kg_to_lbs_rate']);

        return to_route('admin.pricing.edit')->with('status', 'pricing-updated');
    }
}
