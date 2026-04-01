<?php

namespace App\Models;

use App\Notifications\OrderNotifier;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

#[Fillable([
    'user_id', 'guest_name', 'guest_email', 'guest_phone', 'status',
    'price_per_pound_snapshot', 'filleting_fee_snapshot', 'delivery_fee_snapshot',
    'filleting', 'delivery', 'delivery_location', 'total_sbd', 'rejection_reason',
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
    public function transitionTo(string $newStatus, ?string $rejectionReason = null): void
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

        app(OrderNotifier::class)->statusChanged($this, $newStatus);
    }

    /**
     * Display name for the order — authenticated user name or guest name.
     */
    public function customerName(): string
    {
        return $this->user?->name ?? $this->guest_name ?? 'Guest';
    }
}
