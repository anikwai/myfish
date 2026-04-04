<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;

final readonly class StoreUserAvatar
{
    public function handle(User $user, string $requestKey = 'avatar'): void
    {
        $user->clearMediaCollection('avatar');
        $user->addMediaFromRequest($requestKey)->toMediaCollection('avatar');
    }
}
