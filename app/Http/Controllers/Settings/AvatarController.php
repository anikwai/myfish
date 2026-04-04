<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Actions\DestroyUserAvatar;
use App\Actions\StoreUserAvatar;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreAvatarRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AvatarController extends Controller
{
    public function __construct(
        private readonly StoreUserAvatar $storeUserAvatar,
        private readonly DestroyUserAvatar $destroyUserAvatar,
    ) {}

    public function store(StoreAvatarRequest $request): RedirectResponse
    {
        $this->storeUserAvatar->handle($request->user());

        return to_route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $this->destroyUserAvatar->handle($request->user());

        return to_route('profile.edit');
    }
}
