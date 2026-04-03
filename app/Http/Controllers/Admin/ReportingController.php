<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Values\PricingConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReportingController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $request->input('period', 'today');

        [$start, $end] = match ($period) {
            'week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            default => [Carbon::today(), Carbon::today()->endOfDay()],
        };

        $orders = Order::inDateRange($start, $end)
            ->excludingStatuses(['rejected'])
            ->with('items')
            ->get();

        $orderCount = $orders->count();
        $totalRevenue = $orders->sum(fn ($o) => (float) $o->total_sbd);
        $filletingRevenue = $orders->where('filleting', true)->sum(fn ($o) => (float) $o->filleting_fee_snapshot);
        $deliveryRevenue = $orders->where('delivery', true)->sum(fn ($o) => (float) $o->delivery_fee_snapshot);

        $allItems = $orders->flatMap->items;
        $totalKg = $allItems->sum(fn ($i) => (float) $i->quantity_kg);
        $totalPounds = $allItems->sum(fn ($i) => (float) $i->quantity_pounds);

        $topFishTypes = OrderItem::query()
            ->selectRaw('order_items.fish_type_id, fish_types.name, COUNT(DISTINCT order_items.order_id) as order_count, ROUND(SUM(order_items.quantity_kg), 3) as total_kg')
            ->join('fish_types', 'fish_types.id', '=', 'order_items.fish_type_id')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->whereNotIn('orders.status', ['rejected'])
            ->groupBy('order_items.fish_type_id', 'fish_types.name')
            ->orderByDesc('order_count')
            ->get()
            ->map(fn ($item) => [
                'name' => $item->name,
                'order_count' => (int) $item->order_count,
                'total_kg' => (float) $item->total_kg,
            ]);

        $stockHistory = InventoryAdjustment::whereBetween('created_at', [$start, $end])
            ->latest('created_at')
            ->get(['delta_kg', 'reason', 'type', 'created_at']);

        return Inertia::render('admin/reports', [
            'period' => $period,
            'orderCount' => $orderCount,
            'totalRevenue' => round($totalRevenue, 2),
            'filletingRevenue' => round($filletingRevenue, 2),
            'deliveryRevenue' => round($deliveryRevenue, 2),
            'totalKg' => round($totalKg, 3),
            'totalPounds' => round($totalPounds, 3),
            'topFishTypes' => $topFishTypes,
            'stockHistory' => $stockHistory,
            'kgToLbsRate' => PricingConfig::current()->kgToLbsRate,
        ]);
    }
}
