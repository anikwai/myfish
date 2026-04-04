<?php

namespace App\Notifications;

use App\Models\Order;
use App\Services\CloudflarePdfService;
use App\Values\BusinessConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\View;

class InvoiceNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @var array<int, int> */
    public array $backoff = [15, 45, 90, 180];

    public int $tries = 5;

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
        $business = BusinessConfig::current();

        $html = View::make('pdf.invoice', [
            'order' => $order,
            'business' => $business,
        ])->render();

        $pdf = app(CloudflarePdfService::class)->generate($html);

        return (new MailMessage)
            ->subject("Invoice for order #{$order->id} — {$business->name}")
            ->greeting('Your order has been confirmed!')
            ->line("Please find your invoice attached for order #{$order->id}.")
            ->attachData($pdf, "invoice-{$order->id}.pdf", ['mime' => 'application/pdf']);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
