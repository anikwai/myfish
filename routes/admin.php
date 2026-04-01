<?php

use App\Http\Controllers\Admin\FishTypeController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\PricingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('pricing', [PricingController::class, 'edit'])->name('pricing.edit');
    Route::patch('pricing', [PricingController::class, 'update'])->name('pricing.update');

    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory/adjustments', [InventoryController::class, 'adjust'])->name('inventory.adjust');

    Route::get('fish-types', [FishTypeController::class, 'index'])->name('fish-types.index');
    Route::post('fish-types', [FishTypeController::class, 'store'])->name('fish-types.store');
    Route::patch('fish-types/{fishType}', [FishTypeController::class, 'update'])->name('fish-types.update');
});
