<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'guest_name', 'guest_phone', 'status',
    'price_per_pound_snapshot', 'filleting_fee_snapshot', 'delivery_fee_snapshot',
    'filleting', 'delivery', 'delivery_location', 'total_sbd', 'rejection_reason',
])]
class Order extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'filleting' => 'boolean',
            'delivery' => 'boolean',
            'price_per_pound_snapshot' => 'decimal:2',
            'filleting_fee_snapshot' => 'decimal:2',
            'delivery_fee_snapshot' => 'decimal:2',
            'total_sbd' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Display name for the order — authenticated user name or guest name.
     */
    public function customerName(): string
    {
        return $this->user?->name ?? $this->guest_name ?? 'Guest';
    }
}
