<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $inventory = Inventory::current();

        $adjustments = $inventory->adjustments()
            ->with('user:id,name')
            ->latest('created_at')
            ->limit(50)
            ->get(['id', 'user_id', 'type', 'delta_kg', 'reason', 'created_at']);

        return response()->json([
            'stock_kg' => (float) $inventory->stock_kg,
            'adjustments' => $adjustments,
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delta_kg' => ['required', 'numeric', 'not_in:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $inventory = Inventory::current();
        $inventory->adjust(
            deltaKg: $data['delta_kg'],
            type: 'manual',
            reason: $data['reason'],
            userId: $request->user()->id,
        );

        return response()->json([
            'stock_kg' => (float) $inventory->fresh()->stock_kg,
        ]);
    }
}
