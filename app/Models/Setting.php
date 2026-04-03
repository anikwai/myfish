<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

#[Fillable(['key', 'value', 'string_value'])]
class Setting extends Model
{
    protected static function booted(): void
    {
        static::saved(fn () => Cache::memo()->forget('settings.all'));
        static::deleted(fn () => Cache::memo()->forget('settings.all'));
    }

    /**
     * Load all settings in a single query as a plain array, safe for database cache serialization.
     *
     * @return array<string, array{value: string|null, string_value: string|null}>
     */
    public static function allAsKeyed(): array
    {
        return Cache::memo()->rememberForever('settings.all', fn () => static::all()
            ->mapWithKeys(fn (self $setting) => [
                $setting->key => [
                    'value' => $setting->value,
                    'string_value' => $setting->string_value,
                ],
            ])
            ->all()
        );
    }

    public static function has(string $key): bool
    {
        return array_key_exists($key, static::allAsKeyed());
    }

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, float $default = 0): float
    {
        $map = static::allAsKeyed();

        return array_key_exists($key, $map) ? (float) $map[$key]['value'] : $default;
    }

    public static function getString(string $key, string $default = ''): string
    {
        $map = static::allAsKeyed();

        if (! array_key_exists($key, $map) || $map[$key]['string_value'] === null || $map[$key]['string_value'] === '') {
            return $default;
        }

        return (string) $map[$key]['string_value'];
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

    /**
     * Delete a setting by key, invalidating the cache.
     */
    public static function remove(string $key): void
    {
        static::where('key', $key)->first()?->delete();
    }
}
