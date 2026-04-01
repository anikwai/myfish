<?php

namespace App\Actions;

use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;

final class DeductOrderFromInventory
{
    public function execute(Order $order, int $actingUserId): void
    {
        $totalKg = $order->items->sum(fn (OrderItem $item) => (float) $item->quantity_kg);

        Inventory::current()->adjust(
            deltaKg: -$totalKg,
            type: 'deduction',
            reason: "Order #{$order->id} packed",
            userId: $actingUserId,
            orderId: $order->id,
        );
    }
}
