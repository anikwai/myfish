<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuestOrderConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Order $order,
        public readonly string $signedUrl,
    ) {}

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

        return (new MailMessage)
            ->subject("Order #{$order->id} confirmed — MyFish")
            ->greeting("Hi {$order->guest_name},")
            ->line("Thank you for your order! We've received it and will be in touch shortly.")
            ->line("**Order #:** {$order->id}")
            ->line("**Total:** \${$order->total_sbd} SBD")
            ->action('View your order', $this->signedUrl)
            ->line('Create an account to track all your future orders.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
