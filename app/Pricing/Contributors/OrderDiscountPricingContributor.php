<?php

namespace App\Pricing\Contributors;

use App\Pricing\PricingContext;
use App\Pricing\PricingContributor;
use App\Pricing\PricingLedger;
use App\Values\DiscountConfig;

/**
 * {@see PricingPipelinePhase::Discounts} — applies configured discount to fish + fee subtotal.
 */
final class OrderDiscountPricingContributor implements PricingContributor
{
    public function __construct(
        private readonly ?DiscountConfig $discountConfig = null,
    ) {}

    public function contribute(PricingLedger $ledger, PricingContext $context): void
    {
        $config = $this->discountConfig ?? DiscountConfig::current();
        $base = $ledger->orderSubtotalBeforeDiscount();
        $ledger->applyDiscount($config->amountOff($base));
    }
}
