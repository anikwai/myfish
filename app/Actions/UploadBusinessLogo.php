<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Business;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

final readonly class UploadBusinessLogo
{
    public function handle(string $requestKey): Media
    {
        return Business::instance()->addMediaFromRequest($requestKey)->toMediaCollection('logo');
    }
}
