<?php

use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\Auth\TwoFactorController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:api-auth')->group(function (): void {
    Route::post('register', [RegisterController::class, 'store'])->name('api.auth.register');
    Route::post('login', [LoginController::class, 'store'])->name('api.auth.login');
    Route::post('two-factor', [TwoFactorController::class, 'store'])->name('api.auth.two-factor');
    Route::post('forgot-password', [ForgotPasswordController::class, 'store'])->name('api.auth.forgot-password');
    Route::post('reset-password', [ResetPasswordController::class, 'store'])->name('api.auth.reset-password');
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {
    Route::delete('auth/logout', [LogoutController::class, 'destroy'])->name('api.auth.logout');
});
