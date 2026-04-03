<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class ReviewInviteNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

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

        $url = URL::temporarySignedRoute(
            'reviews.show',
            now()->addDays(30),
            ['order' => $order->id],
        );

        return (new MailMessage)
            ->subject("How was your order? #{$order->id}")
            ->greeting("Thanks for your order, {$order->customerName()}!")
            ->line("We'd love to hear what you thought about your recent order #{$order->id}.")
            ->action('Leave a review', $url)
            ->line('This link is valid for 30 days.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
