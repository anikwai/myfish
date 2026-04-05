<?php

use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\Settings\AvatarController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::post('settings/avatar', [AvatarController::class, 'store'])->name('avatar.store');
    Route::delete('settings/avatar', [AvatarController::class, 'destroy'])->name('avatar.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('auth/google/connect', [SocialiteController::class, 'connect'])->name('auth.google.connect');
    Route::get('auth/google/connect/callback', [SocialiteController::class, 'connectCallback'])->name('auth.google.connect.callback');
    Route::delete('auth/google/disconnect', [SocialiteController::class, 'disconnect'])->name('auth.google.disconnect');
});
