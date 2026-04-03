<?php

namespace App\Pricing\Contributors;

use App\Pricing\FishOrderLinesCalculator;
use App\Pricing\PricingContext;
use App\Pricing\PricingContributor;
use App\Pricing\PricingLedger;

/**
 * {@see PricingPipelinePhase::CoreLines}
 */
final class FishLinesPricingContributor implements PricingContributor
{
    public function __construct(
        private readonly FishOrderLinesCalculator $calculator,
    ) {}

    public function contribute(PricingLedger $ledger, PricingContext $context): void
    {
        $result = $this->calculator->calculate(
            $context->items,
            $context->fishTypes,
            $context->pricing,
        );

        $ledger->setFishLines($result['lines'], $result['fish_subtotal']);
    }
}
