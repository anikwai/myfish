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

        $orders = Order::whereBetween('created_at', [$start, $end])
            ->whereNotIn('status', ['rejected'])
            ->with('items')
            ->get();

        $orderCount = $orders->count();
        $totalRevenue = $orders->sum(fn ($o) => (float) $o->total_sbd);
        $filletingRevenue = $orders->where('filleting', true)->sum(fn ($o) => (float) $o->filleting_fee_snapshot);
        $deliveryRevenue = $orders->where('delivery', true)->sum(fn ($o) => (float) $o->delivery_fee_snapshot);

        $allItems = $orders->flatMap->items;
        $totalKg = $allItems->sum(fn ($i) => (float) $i->quantity_kg);
        $totalPounds = $allItems->sum(fn ($i) => (float) $i->quantity_pounds);

        $topFishTypes = OrderItem::whereHas('order', function ($q) use ($start, $end) {
            $q->whereBetween('created_at', [$start, $end])
                ->whereNotIn('status', ['rejected']);
        })
            ->with('fishType:id,name')
            ->get()
            ->groupBy('fish_type_id')
            ->map(fn ($items) => [
                'name' => $items->first()->fishType->name,
                'order_count' => $items->pluck('order_id')->unique()->count(),
                'total_kg' => round($items->sum(fn ($i) => (float) $i->quantity_kg), 3),
            ])
            ->sortByDesc('order_count')
            ->values();

        $stockHistory = InventoryAdjustment::latest('created_at')
            ->limit(30)
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
