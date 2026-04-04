<?php

namespace App\Http\Controllers;

use App\Actions\PlaceGuestOrder;
use App\Http\Requests\StoreGuestOrderRequest;
use App\Models\Order;
use App\States\Order\OrderState;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class GuestOrderController extends Controller
{
    public function __construct(private readonly PlaceGuestOrder $placeGuestOrder) {}

    public function store(StoreGuestOrderRequest $request): RedirectResponse
    {
        $result = $this->placeGuestOrder->handle($request->validated());

        session()->flash('stock_warning', $result['stockWarning']);

        return redirect($result['signedUrl']);
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
            'statusMeta' => OrderState::metaMap(),
        ]);
    }
}
