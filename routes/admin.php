<?php

use App\Http\Controllers\Admin\FishTypeController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PricingController;
use App\Http\Controllers\Admin\ReportingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('reports', [ReportingController::class, 'index'])->name('reports.index');
    Route::get('pricing', [PricingController::class, 'edit'])->name('pricing.edit');
    Route::patch('pricing', [PricingController::class, 'update'])->name('pricing.update');

    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory/adjustments', [InventoryController::class, 'adjust'])->name('inventory.adjust');

    Route::get('fish-types', [FishTypeController::class, 'index'])->name('fish-types.index');
    Route::post('fish-types', [FishTypeController::class, 'store'])->name('fish-types.store');
    Route::patch('fish-types/{fishType}', [FishTypeController::class, 'update'])->name('fish-types.update');
});

Route::middleware(['auth', 'verified', 'role:admin|staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/guest', [OrderController::class, 'createGuest'])->name('orders.guest.create');
    Route::post('orders/guest', [OrderController::class, 'storeGuest'])->name('orders.guest.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');
});
