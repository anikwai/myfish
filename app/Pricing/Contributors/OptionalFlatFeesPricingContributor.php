<?php

namespace App\Pricing\Contributors;

use App\Pricing\PricingContext;
use App\Pricing\PricingContributor;
use App\Pricing\PricingLedger;
use App\Pricing\PricingPipelinePhase;

/**
 * {@see PricingPipelinePhase::FeeAdjustments} — flat filleting and delivery from {@see PricingConfig}.
 */
final class OptionalFlatFeesPricingContributor implements PricingContributor
{
    public function contribute(PricingLedger $ledger, PricingContext $context): void
    {
        if ($context->filleting) {
            $ledger->addFeeTotal($context->pricing->filletingFee);
        }

        if ($context->delivery) {
            $ledger->addFeeTotal($context->pricing->deliveryFee);
        }
    }
}
