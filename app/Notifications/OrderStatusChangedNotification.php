<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order, public readonly string $newStatus) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->order;
        $label = ucfirst(str_replace('_', ' ', $this->newStatus));

        $message = (new MailMessage)
            ->subject("Your order #{$order->id} is now {$label}")
            ->greeting("Order update: {$label}")
            ->line("Your order #{$order->id} has been updated to **{$label}**.");

        if ($this->newStatus === 'rejected' && $order->rejection_reason) {
            $message->line("**Reason:** {$order->rejection_reason}");
        }

        return $message->action('View order', route('orders.show', $order));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
