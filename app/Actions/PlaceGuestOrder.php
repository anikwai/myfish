<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Inventory;
use App\Models\Order;
use App\Notifications\GuestOrderConfirmationNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

final readonly class PlaceGuestOrder
{
    public function __construct(private CreateGuestOrder $createGuestOrder) {}

    /**
     * @param  array<string, mixed>  $data
     * @return array{order: Order, signedUrl: string, stockWarning: bool}
     */
    public function handle(array $data): array
    {
        $order = $this->createGuestOrder->handle(
            guestName: $data['guest_name'],
            guestEmail: $data['guest_email'],
            guestPhone: $data['guest_phone'],
            items: $data['items'],
            filleting: $data['filleting'],
            delivery: $data['delivery'],
            deliveryLocation: $data['delivery_location'] ?? null,
            note: $data['note'] ?? null,
        );

        $totalKg = array_sum(array_column($data['items'], 'quantity_kg'));
        $stockWarning = $totalKg > (float) Inventory::current()->stock_kg;

        $signedUrl = URL::signedRoute('guest-orders.show', ['order' => $order->id]);

        Notification::route('mail', $data['guest_email'])
            ->notify(new GuestOrderConfirmationNotification($order, $signedUrl));

        return compact('order', 'signedUrl', 'stockWarning');
    }
}
