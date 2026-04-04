<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderCreatorInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/** @group Orders */
class OrderController extends Controller
{
    public function __construct(private readonly OrderCreatorInterface $orderCreator) {}

    public function index(Request $request): AnonymousResourceCollection
    {

        $activeStatuses = ['placed', 'confirmed', 'on_hold', 'packed'];

        $query = Order::forUser($request->user()->id)->latest('id');

        $filterStatus = $request->input('status');

        if ($filterStatus === 'active') {
            $query->whereIn('status', $activeStatuses);
        } elseif ($filterStatus !== null) {
            $query->where('status', $filterStatus);
        }

        return OrderResource::collection($query->cursorPaginate(15));
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        $order = $this->orderCreator->placeForUser(
            user: $request->user(),
            items: $data['items'],
            filleting: $data['filleting'],
            delivery: $data['delivery'],
            deliveryLocation: $data['delivery_location'] ?? null,
            note: $data['note'] ?? null,
        );

        $order->load('items.fishType', 'statusLogs');

        return (new OrderResource($order))
            ->includePreviouslyLoadedRelationships()
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        $order->load('items.fishType', 'statusLogs');

        return (new OrderResource($order))->includePreviouslyLoadedRelationships();
    }
}
