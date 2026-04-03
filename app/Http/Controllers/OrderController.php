<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Services\OrderCreatorInterface;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderCreatorInterface $orderCreator) {}

    public function create(): Response
    {
        $pricing = PricingConfig::current();

        return Inertia::render('orders/create', [
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

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $order = $this->orderCreator->placeForUser(
            user: $request->user(),
            items: $data['items'],
            filleting: $data['filleting'],
            delivery: $data['delivery'],
            deliveryLocation: $data['delivery_location'] ?? null,
        );

        $totalKg = array_sum(array_column($data['items'], 'quantity_kg'));
        session()->flash('stock_warning', $totalKg > (float) Inventory::current()->stock_kg);

        return to_route('orders.show', $order);
    }

    public function show(Order $order): Response
    {
        $this->authorizeOrderAccess($order);

        $order->load('items.fishType', 'statusLogs');

        return Inertia::render('orders/show', [
            'order' => $order,
            'statusLogs' => $order->statusLogs->map(fn ($log) => [
                'status' => $log->status,
                'timestamp' => $log->created_at->toISOString(),
            ]),
        ]);
    }

    public function index(Request $request): Response
    {
        /** @var string[] */
        $activeStatuses = ['placed', 'confirmed', 'on_hold', 'packed'];

        $query = Order::where('user_id', $request->user()->id)->latest();

        $filterStatus = $request->input('status');

        if ($filterStatus === 'active') {
            $query->whereIn('status', $activeStatuses);
        } elseif ($filterStatus !== null) {
            $query->where('status', $filterStatus);
        }

        return Inertia::render('orders/index', [
            'orders' => Inertia::scroll(fn () => $query->paginate(20, ['id', 'status', 'total_sbd', 'created_at'])),
            'filterStatus' => $filterStatus,
        ]);
    }

    private function authorizeOrderAccess(Order $order): void
    {
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
