<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateOrderStatus
{
    public function __construct(private DeductOrderFromInventory $deductOrderFromInventory) {}

    public function handle(Order $order, string $newStatus, ?string $rejectionReason, User $actor): void
    {
        DB::transaction(function () use ($order, $newStatus, $rejectionReason, $actor): void {
            $order->transitionTo($newStatus, $rejectionReason, $actor);

            if ($newStatus === 'packed') {
                $this->deductOrderFromInventory->execute($order, $actor->id);
            }
        });
    }
}
