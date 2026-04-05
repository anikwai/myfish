<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;

final readonly class StoreSocialiteAvatar
{
    public function handle(User $user, string $avatarUrl): void
    {
        if ($user->hasMedia('avatar')) {
            return;
        }

        $user->addMediaFromUrl($avatarUrl)->toMediaCollection('avatar');
    }
}
