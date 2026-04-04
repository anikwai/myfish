<?php

namespace App\Notifications;

use App\Events\OrderStatusUpdated;
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
        broadcast(new OrderStatusUpdated($order, $newStatus));

        if ($order->user) {
            $order->user->notify(new OrderStatusChangedNotification($order, $newStatus));
        } elseif ($order->guest_email) {
            Notification::route('mail', $order->guest_email)
                ->notify(new OrderStatusChangedNotification($order, $newStatus));
        }

        if ($newStatus === 'confirmed') {
            $this->sendInvoice($order);
        }

        if ($newStatus === 'delivered') {
            $this->sendReceipt($order);
            $this->sendReviewInvite($order);
        }
    }

    public function sendInvoice(Order $order): void
    {
        $order->loadMissing(['user', 'items.fishType']);

        if ($order->user) {
            $order->user->notify(new InvoiceNotification($order));
        } elseif ($order->guest_email) {
            Notification::route('mail', $order->guest_email)
                ->notify(new InvoiceNotification($order));
        }
    }

    public function sendReviewInvite(Order $order): void
    {
        if ($order->review()->exists()) {
            return;
        }

        if ($order->user) {
            $order->user->notify(new ReviewInviteNotification($order));
        } elseif ($order->guest_email) {
            Notification::route('mail', $order->guest_email)
                ->notify(new ReviewInviteNotification($order));
        }
    }

    public function sendReceipt(Order $order): void
    {
        $order->loadMissing(['user', 'items.fishType']);

        if ($order->user) {
            $order->user->notify(new ReceiptNotification($order));
        } elseif ($order->guest_email) {
            Notification::route('mail', $order->guest_email)
                ->notify(new ReceiptNotification($order));
        }
    }
}
