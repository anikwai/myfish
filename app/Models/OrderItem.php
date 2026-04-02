<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'fish_type_id', 'quantity_kg', 'quantity_pounds', 'kg_to_lbs_rate_snapshot', 'subtotal_sbd'])]
class OrderItem extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_kg' => 'decimal:3',
            'quantity_pounds' => 'decimal:3',
            'kg_to_lbs_rate_snapshot' => 'decimal:5',
            'subtotal_sbd' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<FishType, $this>
     */
    public function fishType(): BelongsTo
    {
        return $this->belongsTo(FishType::class);
    }
}
