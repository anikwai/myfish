<?php

use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use App\Notifications\InvoiceNotification;
use App\Notifications\ReceiptNotification;
use App\Services\CloudflarePdfService;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
    defaultPricing();
    Inventory::current()->update(['stock_kg' => 500]);

    // Stub PDF service so tests never hit Cloudflare
    $this->instance(CloudflarePdfService::class, new class extends CloudflarePdfService
    {
        public function __construct()
        {
            parent::__construct('stub-account', 'stub-token');
        }

        public function generate(string $html): string
        {
            return '%PDF-stub';
        }
    });
});

// ── Invoice on confirmed ──────────────────────────────────────────────────────

test('invoice is sent to client when order is confirmed', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed']);

    Notification::assertSentTo($client, InvoiceNotification::class,
        fn ($n) => $n->order->id === $order->id
    );
});

test('invoice is sent to guest email when guest order is confirmed', function (): void {
    Notification::fake();

    $order = Order::factory()->create([
        'status' => 'placed',
        'user_id' => null,
        'guest_name' => 'John',
        'guest_email' => 'john@example.com',
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed']);

    Notification::assertSentOnDemand(InvoiceNotification::class);
});

test('no invoice is sent when guest has no email', function (): void {
    Notification::fake();

    $order = Order::factory()->create([
        'status' => 'placed',
        'user_id' => null,
        'guest_name' => 'Walk-in',
        'guest_email' => null,
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed']);

    Notification::assertSentOnDemandTimes(InvoiceNotification::class, 0);
});

// ── Receipt on delivered ──────────────────────────────────────────────────────

test('receipt is sent to client when order is delivered', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'packed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    Notification::assertSentTo($client, ReceiptNotification::class,
        fn ($n) => $n->order->id === $order->id
    );
});

test('receipt is sent to guest email when guest order is delivered', function (): void {
    Notification::fake();

    $order = Order::factory()->create([
        'status' => 'packed',
        'user_id' => null,
        'guest_name' => 'John',
        'guest_email' => 'john@example.com',
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    Notification::assertSentOnDemand(ReceiptNotification::class);
});

test('invoice is not sent when order is delivered', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'packed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered']);

    Notification::assertNotSentTo($client, InvoiceNotification::class);
});

test('receipt is not sent when order is confirmed', function (): void {
    Notification::fake();

    $client = User::factory()->client()->create();
    $order = Order::factory()->for($client)->create(['status' => 'placed']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.orders.update-status', $order), ['status' => 'confirmed']);

    Notification::assertNotSentTo($client, ReceiptNotification::class);
});
