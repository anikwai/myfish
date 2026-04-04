<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Values\BusinessConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BusinessController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(BusinessConfig::current()->toInertiaProps());
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'business_address' => ['nullable', 'string', 'max:255'],
            'business_phone' => ['nullable', 'string', 'max:50'],
            'business_email' => ['nullable', 'email', 'max:255'],
        ]);

        BusinessConfig::saveFromValidated($request->only([
            'business_name', 'business_address', 'business_phone', 'business_email',
        ]));

        return response()->json(BusinessConfig::current()->toInertiaProps());
    }

    public function storeLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        Business::instance()->addMediaFromRequest('logo')->toMediaCollection('logo');

        return response()->json(['logo_url' => BusinessConfig::current()->logo_url]);
    }

    public function destroyLogo(): Response
    {
        Business::instance()->clearMediaCollection('logo');

        return response()->noContent();
    }
}
