<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PricingUpdateRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/pricing', [
            'pricing' => [
                'price_per_pound' => Setting::get('price_per_pound'),
                'filleting_fee' => Setting::get('filleting_fee'),
                'delivery_fee' => Setting::get('delivery_fee'),
            ],
        ]);
    }

    public function update(PricingUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Setting::set('price_per_pound', $data['price_per_pound']);
        Setting::set('filleting_fee', $data['filleting_fee']);
        Setting::set('delivery_fee', $data['delivery_fee']);

        return to_route('admin.pricing.edit')->with('status', 'pricing-updated');
    }
}
