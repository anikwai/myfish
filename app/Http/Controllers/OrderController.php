<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use App\Values\PricingConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function create(): Response
    {
        $pricing = PricingConfig::current();

        return Inertia::render('orders/create', [
            'fishTypes' => FishType::active()->orderBy('name')->get(['id', 'name']),
            'pricing' => [
                'price_per_pound' => $pricing->pricePerPound,
                'filleting_fee' => $pricing->filletingFee,
                'delivery_fee' => $pricing->deliveryFee,
            ],
        ]);
    }

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $pricing = PricingConfig::current();
        $pricePerPound = $pricing->pricePerPound;
        $filletingFee = $pricing->filletingFee;
        $deliveryFee = $pricing->deliveryFee;

        $totalPounds = 0;
        $itemsToCreate = [];

        foreach ($data['items'] as $item) {
            $pounds = round($item['quantity_kg'] * 2.20462, 3);
            $subtotal = round($pounds * $pricePerPound, 2);
            $totalPounds += $pounds;

            $itemsToCreate[] = [
                'fish_type_id' => $item['fish_type_id'],
                'quantity_kg' => $item['quantity_kg'],
                'quantity_pounds' => $pounds,
                'subtotal_sbd' => $subtotal,
            ];
        }

        $total = round($totalPounds * $pricePerPound, 2);

        if ($data['filleting']) {
            $total += $filletingFee;
        }

        if ($data['delivery']) {
            $total += $deliveryFee;
        }

        $order = Order::create([
            'user_id' => $request->user()->id,
            'status' => 'placed',
            'price_per_pound_snapshot' => $pricePerPound,
            'filleting_fee_snapshot' => $filletingFee,
            'delivery_fee_snapshot' => $deliveryFee,
            'filleting' => $data['filleting'],
            'delivery' => $data['delivery'],
            'delivery_location' => $data['delivery_location'] ?? null,
            'total_sbd' => $total,
        ]);

        $order->items()->createMany($itemsToCreate);

        // Warn admin if order exceeds available stock
        $totalKg = array_sum(array_column($itemsToCreate, 'quantity_kg'));
        $inventory = Inventory::current();

        session()->flash('stock_warning', $totalKg > (float) $inventory->stock_kg);

        $admins = User::role('admin')->get();
        Notification::send($admins, new OrderPlacedNotification($order));

        return to_route('orders.show', $order);
    }

    public function show(Order $order): Response
    {
        $this->authorizeOrderAccess($order);

        return Inertia::render('orders/show', [
            'order' => $order->load('items.fishType'),
        ]);
    }

    public function index(Request $request): Response
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with('items.fishType')
            ->latest()
            ->get();

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    private function authorizeOrderAccess(Order $order): void
    {
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
