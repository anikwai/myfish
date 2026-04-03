<?php

namespace App\Http\Controllers;

use App\Models\FishType;
use App\Models\Review;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $pricing = PricingConfig::current();

        return Inertia::render('welcome', [
            'fishTypes' => FishType::active()->orderBy('name')->get(['id', 'name', 'price_per_pound']),
            'pricing' => [
                'price_per_pound' => $pricing->pricePerPound,
                'filleting_fee' => $pricing->filletingFee,
                'delivery_fee' => $pricing->deliveryFee,
                'kg_to_lbs_rate' => $pricing->kgToLbsRate,
            ],
            'discount' => DiscountConfig::current()->toInertiaProps(),
            'tax' => TaxConfig::current()->toInertiaProps(),
            'canRegister' => Features::enabled(Features::registration()),
            'reviews' => Review::latest()->limit(10)->get(['id', 'reviewer_name', 'rating', 'comment', 'created_at']),
            'reviewStats' => [
                'average' => round((float) Review::avg('rating'), 1),
                'total' => Review::count(),
            ],
        ]);
    }
}
