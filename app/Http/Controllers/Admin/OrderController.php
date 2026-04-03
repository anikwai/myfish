<?php

namespace App\Http\Controllers\Admin;

use App\Actions\DeductOrderFromInventory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGuestOrderRequest;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\FishType;
use App\Models\Order;
use App\Services\OrderCreatorInterface;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderCreatorInterface $orderCreator) {}

    public function index(Request $request): Response
    {
        $query = Order::with('user:id,name')->latest();

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

        return Inertia::render('admin/orders/index', [
            'orders' => Inertia::scroll(fn () => $query->paginate(20, ['id', 'status', 'total_sbd', 'created_at', 'guest_name', 'user_id'])),
            'filterStatus' => $request->input('status'),
            'search' => $request->input('search', ''),
            'statuses' => array_keys(Order::TRANSITIONS),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['user:id,name', 'items.fishType', 'statusLogs.user:id,name']);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'statusLogs' => $order->statusLogs->map(fn ($log) => [
                'status' => $log->status,
                'timestamp' => $log->created_at->toISOString(),
                'actor' => $log->user?->name,
            ]),
            'allowedTransitions' => Order::TRANSITIONS[$order->status] ?? [],
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $data = $request->validated();
        $newStatus = $data['status'];

        $order->load('items');

        DB::transaction(function () use ($order, $newStatus, $data, $request): void {
            $order->transitionTo($newStatus, $data['rejection_reason'] ?? null, $request->user());

            if ($newStatus === 'packed') {
                (new DeductOrderFromInventory)->execute($order, $request->user()->id);
            }
        });

        return to_route('admin.orders.show', $order)->with('status', 'order-updated');
    }

    public function createGuest(): Response
    {
        $pricing = PricingConfig::current();

        return Inertia::render('admin/orders/guest', [
            'fishTypes' => FishType::active()->orderBy('name')->get(['id', 'name', 'price_per_pound']),
            'pricing' => [
                'price_per_pound' => $pricing->pricePerPound,
                'filleting_fee' => $pricing->filletingFee,
                'delivery_fee' => $pricing->deliveryFee,
                'kg_to_lbs_rate' => $pricing->kgToLbsRate,
            ],
            'discount' => DiscountConfig::current()->toInertiaProps(),
            'tax' => TaxConfig::current()->toInertiaProps(),
        ]);
    }

    public function storeGuest(StoreGuestOrderRequest $request): RedirectResponse
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
        );

        return to_route('admin.orders.show', $order);
    }
}
