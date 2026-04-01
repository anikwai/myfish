<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGuestOrderRequest;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\FishType;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Order::with(['user:id,name', 'items'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('admin/orders/index', [
            'orders' => $query->get(),
            'filterStatus' => $request->status,
            'statuses' => array_keys(Order::TRANSITIONS),
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load(['user:id,name', 'items.fishType']),
            'allowedTransitions' => Order::TRANSITIONS[$order->status] ?? [],
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $data = $request->validated();

        $order->load('items');
        $order->transitionTo($data['status'], $data['rejection_reason'] ?? null);

        return to_route('admin.orders.show', $order)->with('status', 'order-updated');
    }

    public function createGuest(): Response
    {
        return Inertia::render('admin/orders/guest', [
            'fishTypes' => FishType::active()->orderBy('name')->get(['id', 'name']),
            'pricing' => [
                'price_per_pound' => Setting::get('price_per_pound'),
                'filleting_fee' => Setting::get('filleting_fee'),
                'delivery_fee' => Setting::get('delivery_fee'),
            ],
        ]);
    }

    public function storeGuest(StoreGuestOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $pricePerPound = Setting::get('price_per_pound');
        $filletingFee = Setting::get('filleting_fee');
        $deliveryFee = Setting::get('delivery_fee');

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
            'user_id' => null,
            'guest_name' => $data['guest_name'],
            'guest_phone' => $data['guest_phone'],
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

        $admins = User::role('admin')->get();
        Notification::send($admins, new OrderPlacedNotification($order));

        return to_route('admin.orders.show', $order);
    }
}
