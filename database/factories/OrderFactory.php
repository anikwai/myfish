<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'guest_name' => null,
            'guest_email' => null,
            'guest_phone' => null,
            'status' => 'placed',
            'filleting_fee_snapshot' => 10.00,
            'delivery_fee_snapshot' => 5.00,
            'filleting' => false,
            'delivery' => false,
            'delivery_location' => null,
            'discount_sbd' => 0,
            'tax_sbd' => 0,
            'tax_label_snapshot' => 'Tax',
            'total_sbd' => 110.23,
            'rejection_reason' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Order $order): void {
            $order->statusLogs()->create([
                'status' => 'placed',
                'user_id' => null,
                'created_at' => $order->created_at,
            ]);
        });
    }
}
