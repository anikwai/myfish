<?php

namespace App\Support;

use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Shared rules for the business logo: HTTP validation and the Spatie {@code logo} media collection
 * use the same MIME list, matching Laravel's {@code image:allow_svg} (jpg, jpeg, png, gif, bmp, webp, svg).
 */
final class BusinessLogoUpload
{
    public const int MAX_KILOBYTES = 2048;

    /**
     * @return list<string>
     */
    public static function acceptedMimeTypes(): array
    {
        return [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/x-ms-bmp',
            'image/webp',
            'image/svg+xml',
        ];
    }

    /**
     * @return array<int, string|ValidationRule>
     */
    public static function logoRules(): array
    {
        return [
            'required',
            'mimetypes:'.implode(',', self::acceptedMimeTypes()),
            'max:'.self::MAX_KILOBYTES,
        ];
    }
}
