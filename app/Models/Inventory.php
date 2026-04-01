<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['stock_kg'])]
class Inventory extends Model
{
    protected $table = 'inventory';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stock_kg' => 'decimal:3',
        ];
    }

    /**
     * @return HasMany<InventoryAdjustment, $this>
     */
    public function adjustments(): HasMany
    {
        return $this->hasMany(InventoryAdjustment::class);
    }

    /**
     * Get or create the single inventory record.
     */
    public static function current(): static
    {
        return static::firstOrCreate([], ['stock_kg' => 0]);
    }

    /**
     * Apply an adjustment and record it in the log.
     */
    public function adjust(float $deltaKg, string $type, string $reason, int $userId, ?int $orderId = null): InventoryAdjustment
    {
        $this->stock_kg = (float) $this->stock_kg + $deltaKg;
        $this->save();

        return $this->adjustments()->create([
            'user_id' => $userId,
            'order_id' => $orderId,
            'type' => $type,
            'delta_kg' => $deltaKg,
            'reason' => $reason,
        ]);
    }

    /**
     * Equivalent stock in pounds.
     */
    public function stockPounds(): float
    {
        return round((float) $this->stock_kg * 2.20462, 3);
    }
}
