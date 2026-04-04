<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\States\Order\OrderState;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** @var string[] */
    private const ACTIVE_STATUSES = ['placed', 'confirmed', 'on_hold', 'packed'];

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $recentOrders = Order::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get(['id', 'status', 'total_sbd', 'created_at']);

        return Inertia::render('dashboard', [
            'statusMeta' => OrderState::metaMap(),
            'recentOrders' => $recentOrders,
            'orderCount' => Order::where('user_id', $user->id)->count(),
            'activeOrderCount' => Order::where('user_id', $user->id)
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->count(),
            'totalSpend' => Inertia::defer(
                fn () => (float) Order::where('user_id', $user->id)->sum('total_sbd')
            ),
            'activeOrder' => Inertia::defer(
                fn () => Order::where('user_id', $user->id)
                    ->whereIn('status', self::ACTIVE_STATUSES)
                    ->latest()
                    ->first(['id', 'status', 'total_sbd', 'created_at'])
            ),
        ]);
    }
}
