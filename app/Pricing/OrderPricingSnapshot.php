<?php

namespace App\Pricing;

use App\Models\Order;
use App\Models\OrderItem;

/**
 * Immutable result of an order pricing pipeline run, suitable for persisting {@see Order} lines.
 *
 * @param  array<int, array<string, mixed>>  $orderItemPayloads  rows for {@see OrderItem}
 */
final readonly class OrderPricingSnapshot
{
    /**
     * @param  array<int, array<string, mixed>>  $orderItemPayloads
     */
    public function __construct(
        public array $orderItemPayloads,
        public float $fishSubtotalSbd,
        public float $discountSbd,
        public float $taxSbd,
        public float $grandTotalSbd,
    ) {}
}
