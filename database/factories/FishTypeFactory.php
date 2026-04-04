<?php

namespace Database\Factories;

use App\Models\FishType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FishType>
 */
class FishTypeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'is_active' => true,
            'price_per_pound' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
