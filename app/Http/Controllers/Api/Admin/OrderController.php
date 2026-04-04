<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\DeductOrderFromInventory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGuestOrderRequest;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderCreatorInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/** @group Admin - Orders */
class OrderController extends Controller
{
    public function __construct(private readonly OrderCreatorInterface $orderCreator) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with('user:id,name')->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhere('guest_name', 'like', "%{$search}%")
                    ->orWhere('id', is_numeric($search) ? (int) $search : -1);
            });
        }

        return OrderResource::collection($query->cursorPaginate(20));
    }

    public function show(Order $order): OrderResource
    {
        $order->load(['user:id,name', 'items.fishType', 'statusLogs.user:id,name']);

        return (new OrderResource($order))->includePreviouslyLoadedRelationships();
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): OrderResource
    {
        $data = $request->validated();
        $newStatus = $data['status'];

        $order->load(['user:id,name', 'items.fishType', 'statusLogs.user:id,name']);

        DB::transaction(function () use ($order, $newStatus, $data, $request): void {
            $order->transitionTo($newStatus, $data['rejection_reason'] ?? null, $request->user());

            if ($newStatus === 'packed') {
                (new DeductOrderFromInventory)->execute($order, $request->user()->id);
            }
        });

        $order->load(['user:id,name', 'items.fishType', 'statusLogs.user:id,name']);

        return (new OrderResource($order))->includePreviouslyLoadedRelationships();
    }

    public function storeGuest(StoreGuestOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        $order = $this->orderCreator->placeForGuest(
            guestName: $data['guest_name'],
            guestEmail: $data['guest_email'] ?? null,
            guestPhone: $data['guest_phone'],
            items: $data['items'],
            filleting: $data['filleting'],
            delivery: $data['delivery'],
            deliveryLocation: $data['delivery_location'] ?? null,
            note: $data['note'] ?? null,
        );

        $order->load(['user:id,name', 'items.fishType', 'statusLogs.user:id,name']);

        return (new OrderResource($order))
            ->includePreviouslyLoadedRelationships()
            ->response()
            ->setStatusCode(201);
    }
}
