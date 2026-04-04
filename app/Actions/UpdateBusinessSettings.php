<?php

declare(strict_types=1);

namespace App\Actions;

use App\Values\BusinessConfig;

final readonly class UpdateBusinessSettings
{
    public function handle(array $data): void
    {
        BusinessConfig::saveFromValidated($data);
    }
}
