<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGuestOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderCreatorInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\URL;

class GuestOrderController extends Controller
{
    public function __construct(private readonly OrderCreatorInterface $orderCreator) {}

    public function store(StoreGuestOrderRequest $request): Response|JsonResponse
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
            note: $data['note'] ?? null,
        );

        $order->load('items.fishType', 'statusLogs');

        $signedUrl = URL::signedRoute('api.orders.guest.show', ['order' => $order->id]);
        parse_str((string) parse_url($signedUrl, PHP_URL_QUERY), $queryParams);

        return (new OrderResource($order))
            ->includePreviouslyLoadedRelationships()
            ->additional(['meta' => ['tracking_token' => $queryParams['signature']]])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        abort_unless($request->hasValidSignature(), 403);

        $order->load('items.fishType', 'statusLogs');

        return (new OrderResource($order))->includePreviouslyLoadedRelationships();
    }
}
