<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    public function show(): JsonResponse
    {
        $pricing = PricingConfig::current();
        $discount = DiscountConfig::current();
        $tax = TaxConfig::current();

        return response()->json([
            'pricing' => [
                'price_per_pound' => $pricing->pricePerPound,
                'filleting_fee' => $pricing->filletingFee,
                'delivery_fee' => $pricing->deliveryFee,
                'kg_to_lbs_rate' => $pricing->kgToLbsRate,
            ],
            'discount' => $discount->toInertiaProps(),
            'tax' => $tax->toInertiaProps(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'price_per_pound' => ['required', 'numeric', 'min:0'],
            'filleting_fee' => ['required', 'numeric', 'min:0'],
            'delivery_fee' => ['required', 'numeric', 'min:0'],
            'kg_to_lbs_rate' => ['required', 'numeric', 'gt:0'],
        ]);

        PricingConfig::set(
            pricePerPound: $data['price_per_pound'],
            filletingFee: $data['filleting_fee'],
            deliveryFee: $data['delivery_fee'],
            kgToLbsRate: $data['kg_to_lbs_rate'],
        );

        return response()->json([
            'pricing' => [
                'price_per_pound' => $data['price_per_pound'],
                'filleting_fee' => $data['filleting_fee'],
                'delivery_fee' => $data['delivery_fee'],
                'kg_to_lbs_rate' => $data['kg_to_lbs_rate'],
            ],
        ]);
    }
}
