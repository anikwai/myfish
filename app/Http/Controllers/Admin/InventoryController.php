<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WeightUnit;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustmentRequest;
use App\Models\Inventory;
use App\Values\PricingConfig;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        $inventory = Inventory::current();
        $pricing = PricingConfig::current();

        $adjustments = $inventory->adjustments()
            ->with('user:id,name')
            ->latest('created_at')
            ->limit(50)
            ->get(['id', 'user_id', 'type', 'delta_kg', 'reason', 'created_at']);

        $lastAdjustment = $adjustments->first();
        $stockKg = (float) $inventory->stock_kg;

        return Inertia::render('admin/inventory', [
            'stock_kg' => $stockKg,
            'stock_pounds' => round(WeightUnit::Kg->convertTo(WeightUnit::Lbs, $stockKg, $pricing->kgToLbsRate), 3),
            'kg_to_lbs_rate' => $pricing->kgToLbsRate,
            'adjustments' => $adjustments,
            'last_adjustment' => $lastAdjustment ? [
                'user_name' => $lastAdjustment->user?->name,
                'created_at' => $lastAdjustment->created_at,
            ] : null,
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
