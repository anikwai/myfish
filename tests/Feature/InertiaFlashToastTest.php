<?php

use App\Models\User;
use App\Support\FlashToast;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

dataset('toast types', [
    'success' => ['success', fn () => FlashToast::success('Saved.')],
    'error' => ['error',   fn () => FlashToast::error('Failed.')],
    'warning' => ['warning', fn () => FlashToast::warning('Watch out.')],
    'info' => ['info',    fn () => FlashToast::info('FYI.')],
]);

test('inertia shares flashed toast on the next request', function (string $type, Closure $flash): void {
    $user = User::factory()->client()->create();

    $flash();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.toast.type', $type)
            ->where('flash.toast.title', null)
            ->has('flash.toast.id')
            ->has('flash.toast.message'));
})->with('toast types');

test('inertia shares flashed toast with a title', function (): void {
    $user = User::factory()->client()->create();

    FlashToast::success('Your order has been placed.', 'Order confirmed');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.toast.type', 'success')
            ->where('flash.toast.message', 'Your order has been placed.')
            ->where('flash.toast.title', 'Order confirmed')
            ->has('flash.toast.id'));
});
