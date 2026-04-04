<?php

namespace App\Support;

use App\Models\Business;
use App\Values\BusinessConfig;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Imagick;
use ImagickPixel;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Resolves the business logo {@code src} for HTML mail: prefers CID embedding so images work when
 * {@code APP_URL} is not publicly reachable. SVG logos are rasterized to PNG for embedding because
 * most email clients do not render SVG in {@code <img>} (including inline CID).
 */
final class BusinessMailBranding
{
    public static function logoImgSrc(?Message $mailMessage): ?string
    {
        $media = Business::instance()->getFirstMedia('logo');
        if ($media === null) {
            return null;
        }

        if ($mailMessage === null) {
            return BusinessConfig::current()->logo_url;
        }

        $disk = Storage::disk($media->disk);
        $relativePath = $media->getPathRelativeToRoot();

        if (! $disk->exists($relativePath)) {
            return BusinessConfig::current()->logo_url;
        }

        $binary = $disk->get($relativePath);
        if ($binary === '' || $binary === false) {
            return BusinessConfig::current()->logo_url;
        }

        if (self::isSvg($media, $binary)) {
            $png = self::rasterizeSvgToPng($binary);
            if ($png === null) {
                return null;
            }

            return $mailMessage->embedData($png, 'business-logo.png', 'image/png');
        }

        $mime = $media->mime_type;
        if ($mime === null || $mime === '') {
            $mime = 'application/octet-stream';
        }

        return $mailMessage->embedData($binary, $media->file_name, $mime);
    }

    private static function isSvg(Media $media, string $contents): bool
    {
        $mime = strtolower((string) $media->mime_type);
        if (str_contains($mime, 'svg')) {
            return true;
        }

        if (Str::endsWith(strtolower($media->file_name), '.svg')) {
            return true;
        }

        $trim = ltrim($contents);

        return str_starts_with($trim, '<') && str_contains($trim, '<svg');
    }

    private static function rasterizeSvgToPng(string $svgXml): ?string
    {
        if (! extension_loaded('imagick') || ! class_exists(Imagick::class)) {
            return null;
        }

        try {
            $imagick = new Imagick;
            $imagick->setBackgroundColor(new ImagickPixel('transparent'));
            $imagick->setResolution(192, 192);
            $imagick->readImageBlob($svgXml);
            $imagick->setImageFormat('png');
            $imagick->mergeImageLayers(Imagick::LAYERMETHOD_FLATTEN);

            return $imagick->getImageBlob();
        } catch (\Throwable) {
            return null;
        }
    }
}
