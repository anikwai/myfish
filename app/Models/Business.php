<?php

namespace App\Models;

use App\Support\BusinessLogoUpload;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(BusinessLogoUpload::acceptedMimeTypes());
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        if ($this->logoMediaIsSvg($media)) {
            return;
        }

        $this->addMediaConversion('preview')
            ->fit(Fit::Contain, 300, 300)
            ->nonQueued();
    }

    private function logoMediaIsSvg(?Media $media): bool
    {
        if ($media === null) {
            return false;
        }

        $mime = strtolower((string) $media->mime_type);

        if (str_contains($mime, 'svg')) {
            return true;
        }

        return Str::endsWith(strtolower($media->file_name), '.svg');
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
            $mime = Str::endsWith(strtolower($media->file_name), '.svg')
                ? 'image/svg+xml'
                : 'image/png';
        }

        return 'data:'.$mime.';base64,'.base64_encode($contents);
    }
}
