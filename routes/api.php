<?php

use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\Auth\TwoFactorController;
use App\Http\Controllers\Api\GuestOrderController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Broadcasting\BroadcastController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:api-auth')->group(function (): void {
    Route::post('register', [RegisterController::class, 'store'])->name('api.auth.register');
    Route::post('login', [LoginController::class, 'store'])->name('api.auth.login');
    Route::post('two-factor', [TwoFactorController::class, 'store'])->name('api.auth.two-factor');
    Route::post('forgot-password', [ForgotPasswordController::class, 'store'])->name('api.auth.forgot-password');
    Route::post('reset-password', [ResetPasswordController::class, 'store'])->name('api.auth.reset-password');
});

Route::middleware('throttle:api')->group(function (): void {
    Route::post('orders/guest', [GuestOrderController::class, 'store'])->name('api.orders.guest.store');
    Route::get('orders/guest/{order}', [GuestOrderController::class, 'show'])->name('api.orders.guest.show');
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {
    Route::post('broadcasting/auth', [BroadcastController::class, 'authenticate'])->name('api.broadcasting.auth');

    Route::delete('auth/logout', [LogoutController::class, 'destroy'])->name('api.auth.logout');

    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show'])->names([
        'index' => 'api.orders.index',
        'store' => 'api.orders.store',
        'show' => 'api.orders.show',
    ]);

    Route::post('orders/{order}/review', [ReviewController::class, 'store'])->name('api.orders.review.store');

    Route::get('notifications', [NotificationController::class, 'index'])->name('api.notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('api.notifications.read');
});

Route::middleware(['auth:sanctum', 'throttle:api', 'role:admin|staff'])->prefix('admin')->group(function (): void {
    Route::get('orders', [AdminOrderController::class, 'index'])->name('api.admin.orders.index');
    Route::post('orders/guest', [AdminOrderController::class, 'storeGuest'])->name('api.admin.orders.guest.store');
    Route::get('orders/{order}', [AdminOrderController::class, 'show'])->name('api.admin.orders.show');
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('api.admin.orders.status');
});
