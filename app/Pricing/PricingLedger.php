<?php

namespace App\Pricing;

/**
 * Mutable working state while contributors run. Converted to {@see OrderPricingSnapshot} at the end.
 */
final class PricingLedger
{
    /** @var array<int, array<string, mixed>> */
    private array $orderItemPayloads = [];

    private float $fishSubtotalSum = 0.0;

    private float $grandTotal = 0.0;

    private float $discountSbd = 0.0;

    private float $taxSbd = 0.0;

    /**
     * @param  array<int, array<string, mixed>>  $payloads
     */
    public function setFishLines(array $payloads, float $fishSubtotalSum): void
    {
        $this->orderItemPayloads = $payloads;
        $this->fishSubtotalSum = $fishSubtotalSum;
        $this->grandTotal = round($fishSubtotalSum, 2);
    }

    public function addFeeTotal(float $amount): void
    {
        $this->grandTotal += $amount;
    }

    /**
     * Order subtotal (fish + fees) before the discount phase runs.
     */
    public function orderSubtotalBeforeDiscount(): float
    {
        return round($this->grandTotal, 2);
    }

    public function applyDiscount(float $amount): void
    {
        $amount = round(max(0.0, $amount), 2);
        $cap = round($this->grandTotal, 2);
        $amount = min($amount, $cap);
        $this->discountSbd = $amount;
        $this->grandTotal = round($this->grandTotal - $amount, 2);
    }

    /**
     * Exclusive subtotal after discount, before the tax phase.
     */
    public function taxableExclusiveSubtotal(): float
    {
        return round($this->grandTotal, 2);
    }

    public function applyTax(float $amount): void
    {
        $amount = round(max(0.0, $amount), 2);
        $this->taxSbd = $amount;
        $this->grandTotal = round($this->grandTotal + $amount, 2);
    }

    public function toSnapshot(): OrderPricingSnapshot
    {
        return new OrderPricingSnapshot(
            $this->orderItemPayloads,
            round($this->fishSubtotalSum, 2),
            round($this->discountSbd, 2),
            round($this->taxSbd, 2),
            round($this->grandTotal, 2),
        );
    }
}
