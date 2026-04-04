<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Business extends Model implements HasMedia
{
    use InteractsWithMedia;

    public static function instance(): self
    {
        return self::find(1) ?? tap(new self, function (self $business): void {
            $business->id = 1;
            $business->save();
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('preview')
            ->fit(Fit::Contain, 300, 300)
            ->nonQueued();
    }

    /**
     * Data URI for the logo so HTML can be rendered by remote PDF engines (e.g. Cloudflare Browser
     * Rendering) that cannot fetch URLs on the app host or private networks.
     */
    public function logoDataUriForPdf(): ?string
    {
        $media = $this->getFirstMedia('logo');
        if ($media === null) {
            return null;
        }

        $disk = Storage::disk($media->disk);
        $relativePath = $media->getPathRelativeToRoot();

        if (! $disk->exists($relativePath)) {
            return null;
        }

        $contents = $disk->get($relativePath);
        if ($contents === '' || $contents === false) {
            return null;
        }

        $mime = $media->mime_type;
        if ($mime === null || $mime === '') {
            $mime = 'image/png';
        }

        return 'data:'.$mime.';base64,'.base64_encode($contents);
    }
}
