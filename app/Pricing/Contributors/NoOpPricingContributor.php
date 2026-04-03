<?php

namespace App\Pricing\Contributors;

use App\Pricing\PricingContext;
use App\Pricing\PricingContributor;
use App\Pricing\PricingLedger;
use App\Pricing\PricingPipelinePhase;

/**
 * Placeholder until discount or tax rules exist. Keeps phase ordering stable in {@see OrderPricingPipeline}.
 */
final class NoOpPricingContributor implements PricingContributor
{
    public function __construct(
        public readonly PricingPipelinePhase $phase,
    ) {}

    public function contribute(PricingLedger $ledger, PricingContext $context): void
    {
        // Intentionally empty.
    }
}
