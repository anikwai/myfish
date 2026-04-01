<?php

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use App\Notifications\GuestOrderConfirmationNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
    Inventory::current()->update(['stock_kg' => 500]);
});

test('guest can place an order', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);

    Notification::fake();

    $this->post(route('guest-orders.store'), [
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
    ])->assertRedirect();

    $order = Order::first();

    expect($order)->not->toBeNull()
        ->and($order->guest_name)->toBe('John Doe')
        ->and($order->guest_email)->toBe('john@example.com')
        ->and($order->guest_phone)->toBe('+677 12345')
        ->and($order->user_id)->toBeNull()
        ->and($order->status)->toBe('placed');
});

test('guest order sends confirmation email with signed url', function (): void {
    $tuna = FishType::create(['name' => 'Tuna', 'is_active' => true]);

    Notification::fake();

    $this->post(route('guest-orders.store'), [
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
        'items' => [['fish_type_id' => $tuna->id, 'quantity_kg' => 2]],
        'filleting' => false,
        'delivery' => false,
    ]);

    Notification::assertSentOnDemand(GuestOrderConfirmationNotification::class);
});

test('guest can view order via signed url', function (): void {
    $order = Order::factory()->create([
        'guest_name' => 'John Doe',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 12345',
    ]);

    $signedUrl = URL::signedRoute('guest-orders.show', ['order' => $order->id]);

    $this->get($signedUrl)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('orders/guest-confirmation'));
});

test('guest cannot view order with invalid signature', function (): void {
    $order = Order::factory()->create([
        'guest_email' => 'john@example.com',
    ]);

    $this->get(route('guest-orders.show', $order))
        ->assertForbidden();
});

test('guest order validation requires guest fields', function (): void {
    $this->post(route('guest-orders.store'), [
        'filleting' => false,
        'delivery' => false,
    ])->assertSessionHasErrors(['guest_name', 'guest_email', 'guest_phone', 'items']);
});

test('registration links guest orders by email', function (): void {
    $order = Order::factory()->create([
        'guest_name' => 'John',
        'guest_email' => 'john@example.com',
        'guest_phone' => '+677 99999',
        'user_id' => null,
    ]);

    $this->post(route('register'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'john@example.com')->first();

    expect($order->fresh()->user_id)->toBe($user->id);
});

test('registration links guest orders by phone', function (): void {
    $order = Order::factory()->create([
        'guest_name' => 'John',
        'guest_email' => 'other@example.com',
        'guest_phone' => '+677 12345',
        'user_id' => null,
    ]);

    $this->post(route('register'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'phone' => '+677 12345',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'john@example.com')->first();

    expect($order->fresh()->user_id)->toBe($user->id);
});
