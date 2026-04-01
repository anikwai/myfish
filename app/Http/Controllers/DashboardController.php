<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $recentOrders = Order::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get(['id', 'status', 'total_sbd', 'created_at']);

        return Inertia::render('dashboard', [
            'recentOrders' => $recentOrders,
            'orderCount' => Order::where('user_id', $user->id)->count(),
        ]);
    }
}
