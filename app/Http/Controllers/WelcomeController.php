<?php

namespace App\Http\Controllers;

use App\Models\FishType;
use App\Values\PricingConfig;
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
            'fishTypes' => FishType::active()->orderBy('name')->get(['id', 'name']),
            'pricing' => [
                'price_per_pound' => $pricing->pricePerPound,
                'filleting_fee' => $pricing->filletingFee,
                'delivery_fee' => $pricing->deliveryFee,
                'kg_to_lbs_rate' => $pricing->kgToLbsRate,
            ],
            'canRegister' => Features::enabled(Features::registration()),
        ]);
    }
}
