<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value'])]
class Setting extends Model
{
    /**
     * Get a setting value by key.
     */
    public static function get(string $key, float $default = 0): float
    {
        return (float) static::where('key', $key)->value('value') ?? $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, float $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
