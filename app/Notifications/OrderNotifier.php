<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

final class OrderNotifier
{
    public function orderPlaced(Order $order): void
    {
        $admins = User::role('admin')->get();

        Notification::send($admins, new OrderPlacedNotification($order));
    }

    public function statusChanged(Order $order, string $newStatus): void
    {
        if (! $order->user) {
            return;
        }

        $order->user->notify(new OrderStatusChangedNotification($order, $newStatus));
    }
}
