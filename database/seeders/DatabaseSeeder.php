<?php

namespace Database\Seeders;

use App\Models\FishType;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        // ── Users ───────────────────────────────────────────────────────────

        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@myfish.test',
            'phone' => '+677 20001',
            'password' => Hash::make('password'),
        ]);

        User::factory()->staff()->create([
            'name' => 'Staff User',
            'email' => 'staff@myfish.test',
            'phone' => '+677 20002',
            'password' => Hash::make('password'),
        ]);

        $client = User::factory()->client()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@myfish.test',
            'phone' => '+677 30001',
            'password' => Hash::make('password'),
        ]);

        // ── Fish types ──────────────────────────────────────────────────────

        $fishTypes = collect([
            'Tuna',
            'Snapper',
            'Mahi-mahi',
            'Grouper',
            'Barracuda',
        ])->map(fn (string $name) => FishType::create(['name' => $name, 'is_active' => true]));

        // ── Inventory ───────────────────────────────────────────────────────

        Inventory::create(['stock_kg' => 250.0]);

        // ── Orders for the client ───────────────────────────────────────────

        $feeSnapshots = [
            'filleting_fee_snapshot' => 10.00,
            'delivery_fee_snapshot' => 5.00,
        ];

        $statuses = ['placed', 'confirmed', 'packed', 'delivered', 'on_hold'];

        foreach ($statuses as $i => $status) {
            $filleting = $i % 2 === 0;
            $delivery = $i % 3 === 0;

            $order = Order::create([
                ...$feeSnapshots,
                'user_id' => $client->id,
                'status' => $status,
                'filleting' => $filleting,
                'delivery' => $delivery,
                'delivery_location' => $delivery ? 'Near the market, Honiara' : null,
                'discount_sbd' => 0,
                'tax_sbd' => 0,
                'tax_label_snapshot' => 'Tax',
                'total_sbd' => 75.50 + ($i * 12),
                'created_at' => now()->subDays(10 - $i),
                'updated_at' => now()->subDays(10 - $i),
            ]);

            $order->items()->create([
                'fish_type_id' => $fishTypes[$i % $fishTypes->count()]->id,
                'quantity_kg' => 2.5 + $i,
                'quantity_pounds' => round((2.5 + $i) * 2.20462, 3),
                'subtotal_sbd' => round((2.5 + $i) * 2.20462 * 25.00, 2),
                'price_per_pound_snapshot' => 25.00,
            ]);
        }

        // ── A guest order ───────────────────────────────────────────────────

        $guestOrder = Order::create([
            ...$feeSnapshots,
            'user_id' => null,
            'guest_name' => 'John Guest',
            'guest_email' => 'john@example.com',
            'guest_phone' => '+677 99999',
            'status' => 'placed',
            'filleting' => false,
            'delivery' => false,
            'delivery_location' => null,
            'discount_sbd' => 0,
            'tax_sbd' => 0,
            'tax_label_snapshot' => 'Tax',
            'total_sbd' => 55.25,
        ]);

        $guestOrder->items()->create([
            'fish_type_id' => $fishTypes->first()->id,
            'quantity_kg' => 1.0,
            'quantity_pounds' => 2.205,
            'subtotal_sbd' => 55.13,
            'price_per_pound_snapshot' => 25.00,
        ]);
    }
}
