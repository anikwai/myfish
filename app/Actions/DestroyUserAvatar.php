<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;

final readonly class DestroyUserAvatar
{
    public function handle(User $user): void
    {
        $user->clearMediaCollection('avatar');
    }
}
