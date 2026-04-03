<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value', 'string_value'])]
class Setting extends Model
{
    public static function has(string $key): bool
    {
        return static::where('key', $key)->exists();
    }

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, float $default = 0): float
    {
        return (float) static::where('key', $key)->value('value') ?? $default;
    }

    public static function getString(string $key, string $default = ''): string
    {
        $v = static::where('key', $key)->value('string_value');

        if ($v === null || $v === '') {
            return $default;
        }

        return (string) $v;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, float $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public static function setString(string $key, string $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['string_value' => $value, 'value' => 0.0],
        );
    }
}
