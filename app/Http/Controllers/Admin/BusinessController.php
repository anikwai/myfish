<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BusinessUpdateRequest;
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
}
