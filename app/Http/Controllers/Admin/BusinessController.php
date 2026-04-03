<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BusinessLogoRequest;
use App\Http\Requests\Admin\BusinessUpdateRequest;
use App\Models\Business;
use App\Values\BusinessConfig;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/business', [
            'business' => BusinessConfig::current()->toInertiaProps(),
        ]);
    }

    public function update(BusinessUpdateRequest $request): RedirectResponse
    {
        BusinessConfig::saveFromValidated($request->validated());

        return to_route('admin.business.edit')->with('status', 'business-updated');
    }

    public function storeLogo(BusinessLogoRequest $request): RedirectResponse
    {
        Business::instance()->addMediaFromRequest('logo')->toMediaCollection('logo');

        return to_route('admin.business.edit')->with('status', 'logo-updated');
    }

    public function destroyLogo(): RedirectResponse
    {
        Business::instance()->clearMediaCollection('logo');

        return to_route('admin.business.edit')->with('status', 'logo-removed');
    }
}
