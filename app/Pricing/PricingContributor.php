<?php

namespace App\Pricing;

/**
 * One step in {@see OrderPricingPipeline}. Implementations append to {@see PricingLedger} only
 * through its public methods—never persist from here.
 */
interface PricingContributor
{
    public function contribute(PricingLedger $ledger, PricingContext $context): void;
}
