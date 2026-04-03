<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'is_active', 'price_per_pound'])]
class FishType extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'price_per_pound' => 'decimal:2',
        ];
    }

    /**
     * Per-species rate when set; otherwise the global default from settings.
     */
    public function effectivePrice(float $globalPricePerPound): float
    {
        if ($this->price_per_pound === null) {
            return $globalPricePerPound;
        }

        return (float) $this->price_per_pound;
    }

    /**
     * @param  Builder<FishType>  $query
     * @return Builder<FishType>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
