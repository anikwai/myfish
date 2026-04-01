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
            'guest_phone' => null,
            'status' => 'placed',
            'price_per_pound_snapshot' => 25.00,
            'filleting_fee_snapshot' => 10.00,
            'delivery_fee_snapshot' => 5.00,
            'filleting' => false,
            'delivery' => false,
            'delivery_location' => null,
            'total_sbd' => 110.23,
            'rejection_reason' => null,
        ];
    }
}
