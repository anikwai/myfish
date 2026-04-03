<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestOrderController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');

Route::post('orders/guest', [GuestOrderController::class, 'store'])->name('guest-orders.store');
Route::get('orders/guest/{order}', [GuestOrderController::class, 'show'])->name('guest-orders.show');

Route::get('reviews/{order}', [ReviewController::class, 'show'])->name('reviews.show')->middleware('signed');
Route::post('reviews/{order}', [ReviewController::class, 'store'])->name('reviews.store')->middleware('signed');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
});

require __DIR__.'/settings.php';
