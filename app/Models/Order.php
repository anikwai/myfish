<?php

namespace App\Models;

use App\States\Order\OrderState;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Spatie\ModelStates\HasStates;

#[Fillable([
    'user_id', 'guest_name', 'guest_email', 'guest_phone', 'status',
    'filleting_fee_snapshot', 'delivery_fee_snapshot',
    'filleting', 'delivery', 'delivery_location', 'note', 'discount_sbd', 'tax_sbd', 'tax_label_snapshot', 'total_sbd', 'rejection_reason',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    use HasStates;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrderState::class,
            'filleting' => 'boolean',
            'delivery' => 'boolean',
            'filleting_fee_snapshot' => 'decimal:2',
            'delivery_fee_snapshot' => 'decimal:2',
            'discount_sbd' => 'decimal:2',
            'tax_sbd' => 'decimal:2',
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
     * @return HasOne<Review, $this>
     */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Total ordered kg exceeds current inventory snapshot (for post-checkout messaging).
     */
    public function exceedsCurrentInventory(): bool
    {
        $this->loadMissing('items');

        $totalKg = (float) $this->items->sum(
            fn (OrderItem $item): float => (float) $item->quantity_kg
        );

        return $totalKg > (float) Inventory::current()->stock_kg;
    }

    /**
     * @return HasMany<OrderStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class)->orderBy('created_at');
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeInDateRange(Builder $query, Carbon $start, Carbon $end): Builder
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }

    /**
     * @param  Builder<Order>  $query
     * @param  string[]  $statuses
     * @return Builder<Order>
     */
    public function scopeExcludingStatuses(Builder $query, array $statuses): Builder
    {
        return $query->whereNotIn('status', $statuses);
    }

    /**
     * Display name for the order — authenticated user name or guest name.
     */
    public function customerName(): string
    {
        return $this->user?->name ?? $this->guest_name ?? 'Guest';
    }
}
