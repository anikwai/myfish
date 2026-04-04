<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\ToastType;
use Illuminate\Support\Str;

final class FlashToast
{
    public const string ORDER_EXCEEDS_STOCK_MESSAGE = 'Note: your order quantity exceeds current available stock. We will confirm availability shortly.';

    public static function success(string $message, ?string $title = null, ?string $id = null): void
    {
        self::flash(ToastType::Success, $message, $title, $id);
    }

    public static function error(string $message, ?string $title = null, ?string $id = null): void
    {
        self::flash(ToastType::Error, $message, $title, $id);
    }

    public static function warning(string $message, ?string $title = null, ?string $id = null): void
    {
        self::flash(ToastType::Warning, $message, $title, $id);
    }

    public static function info(string $message, ?string $title = null, ?string $id = null): void
    {
        self::flash(ToastType::Info, $message, $title, $id);
    }

    /**
     * @return array{type: string, message: string, title: string|null, id: string}
     */
    private static function payload(ToastType $type, string $message, ?string $title, ?string $id): array
    {
        return [
            'type' => $type->value,
            'message' => $message,
            'title' => $title,
            'id' => $id ?? (string) Str::uuid(),
        ];
    }

    private static function flash(ToastType $type, string $message, ?string $title, ?string $id): void
    {
        session()->flash('toast', self::payload($type, $message, $title, $id));
    }
}
