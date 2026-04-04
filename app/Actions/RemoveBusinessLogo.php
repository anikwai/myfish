<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Business;

final readonly class RemoveBusinessLogo
{
    public function handle(): void
    {
        Business::instance()->clearMediaCollection('logo');
    }
}
