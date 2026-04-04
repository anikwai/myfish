<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\FishType;

final readonly class UpdateFishType
{
    public function handle(FishType $fishType, array $data): void
    {
        $fishType->update($data);
    }
}
