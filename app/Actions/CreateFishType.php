<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\FishType;

final readonly class CreateFishType
{
    public function handle(array $data): FishType
    {
        return FishType::create($data);
    }
}
