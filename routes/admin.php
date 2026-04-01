<?php

use App\Http\Controllers\Admin\PricingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('pricing', [PricingController::class, 'edit'])->name('pricing.edit');
    Route::patch('pricing', [PricingController::class, 'update'])->name('pricing.update');
});
