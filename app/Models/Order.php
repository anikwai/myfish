<?php

namespace App\Models;

use App\Notifications\OrderNotifier;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

#[Fillable([
    'user_id', 'guest_name', 'guest_email', 'guest_phone', 'status',
    'filleting_fee_snapshot', 'delivery_fee_snapshot',
    'filleting', 'delivery', 'delivery_location', 'note', 'discount_sbd', 'tax_sbd', 'tax_label_snapshot', 'total_sbd', 'rejection_reason',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
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
     * @return HasMany<OrderStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class)->orderBy('created_at');
    }

    /**
     * Valid transitions from each status.
     *
     * @var array<string, string[]>
     */
    public const TRANSITIONS = [
        'placed' => ['confirmed', 'rejected', 'on_hold'],
        'on_hold' => ['confirmed', 'rejected'],
        'confirmed' => ['packed'],
        'packed' => ['delivered'],
        'rejected' => [],
        'delivered' => [],
    ];

    /**
     * Transition this order to a new status, or throw if the transition is invalid.
     */
    public function transitionTo(string $newStatus, ?string $rejectionReason = null, ?User $actor = null): void
    {
        $allowed = static::TRANSITIONS[$this->status] ?? [];

        if (! in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition from '{$this->status}' to '{$newStatus}'.",
            ]);
        }

        $this->status = $newStatus;

        if ($newStatus === 'rejected') {
            $this->rejection_reason = $rejectionReason;
        }

        $this->save();

        $this->statusLogs()->create([
            'status' => $newStatus,
            'user_id' => $actor?->id,
        ]);

        app(OrderNotifier::class)->statusChanged($this, $newStatus);
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
