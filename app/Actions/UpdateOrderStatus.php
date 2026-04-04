<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Order;
use App\Models\User;
use App\States\Order\OrderRejected;
use App\States\Order\OrderState;
use Illuminate\Support\Facades\DB;

final readonly class UpdateOrderStatus
{
    public function handle(Order $order, string $newStatus, ?string $rejectionReason, User $actor): void
    {
        $stateClass = OrderState::classFromName($newStatus);

        DB::transaction(function () use ($order, $stateClass, $rejectionReason, $actor): void {
            if ($stateClass === OrderRejected::class) {
                $order->status->transitionTo($stateClass, $rejectionReason, $actor);
            } else {
                $order->status->transitionTo($stateClass, $actor);
            }
        });
    }
}
