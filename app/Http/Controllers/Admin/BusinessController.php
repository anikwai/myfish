<?php

namespace App\Http\Controllers\Admin;

use App\Actions\RemoveBusinessLogo;
use App\Actions\UpdateBusinessSettings;
use App\Actions\UploadBusinessLogo;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BusinessLogoRequest;
use App\Http\Requests\Admin\BusinessUpdateRequest;
use App\Values\BusinessConfig;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    public function __construct(
        private readonly UpdateBusinessSettings $updateBusinessSettings,
        private readonly UploadBusinessLogo $uploadBusinessLogo,
        private readonly RemoveBusinessLogo $removeBusinessLogo,
    ) {}

    public function edit(): Response
    {
        return Inertia::render('admin/business', [
            'business' => BusinessConfig::current()->toInertiaProps(),
        ]);
    }

    public function update(BusinessUpdateRequest $request): RedirectResponse
    {
        $this->updateBusinessSettings->handle($request->validated());

        return to_route('admin.business.edit')->with('status', 'business-updated');
    }

    public function storeLogo(BusinessLogoRequest $request): RedirectResponse
    {
        $this->uploadBusinessLogo->handle('logo');

        return to_route('admin.business.edit')->with('status', 'logo-updated');
    }

    public function destroyLogo(): RedirectResponse
    {
        $this->removeBusinessLogo->handle();

        return to_route('admin.business.edit')->with('status', 'logo-removed');
    }
}
