<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustmentRequest;
use App\Models\Inventory;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        $inventory = Inventory::current();

        $adjustments = $inventory->adjustments()
            ->with('user:id,name')
            ->latest('created_at')
            ->limit(50)
            ->get();

        return Inertia::render('admin/inventory', [
            'stock_kg' => (float) $inventory->stock_kg,
            'stock_pounds' => $inventory->stockPounds(),
            'adjustments' => $adjustments,
        ]);
    }

    public function adjust(InventoryAdjustmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $inventory = Inventory::current();
        $inventory->adjust(
            deltaKg: $data['delta_kg'],
            type: 'manual',
            reason: $data['reason'],
            userId: $request->user()->id,
        );

        return to_route('admin.inventory.index')->with('status', 'inventory-updated');
    }
}
