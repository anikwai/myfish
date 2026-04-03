<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGuestOrderRequest;
use App\Models\Inventory;
use App\Models\Order;
use App\Notifications\GuestOrderConfirmationNotification;
use App\Services\OrderCreatorInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class GuestOrderController extends Controller
{
    public function __construct(private readonly OrderCreatorInterface $orderCreator) {}

    public function store(StoreGuestOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $order = $this->orderCreator->placeForGuest(
            guestName: $data['guest_name'],
            guestEmail: $data['guest_email'],
            guestPhone: $data['guest_phone'],
            items: $data['items'],
            filleting: $data['filleting'],
            delivery: $data['delivery'],
            deliveryLocation: $data['delivery_location'] ?? null,
        );

        $totalKg = array_sum(array_column($data['items'], 'quantity_kg'));
        session()->flash('stock_warning', $totalKg > (float) Inventory::current()->stock_kg);

        $signedUrl = URL::signedRoute('guest-orders.show', ['order' => $order->id]);

        Notification::route('mail', $data['guest_email'])
            ->notify(new GuestOrderConfirmationNotification($order, $signedUrl));

        return redirect($signedUrl);
    }

    public function show(Request $request, Order $order): Response
    {
        abort_unless($request->hasValidSignature(), 403);

        $order->load('items.fishType', 'statusLogs');

        return Inertia::render('orders/guest-confirmation', [
            'order' => $order,
            'statusLogs' => $order->statusLogs->map(fn ($log) => [
                'status' => $log->status,
                'timestamp' => $log->created_at->toISOString(),
            ]),
            'canRegister' => Features::enabled(Features::registration()),
        ]);
    }
}
