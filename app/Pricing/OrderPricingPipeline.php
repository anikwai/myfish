<?php

namespace App\Pricing;

use App\Pricing\Contributors\FinalizePricingContributor;
use App\Pricing\Contributors\FishLinesPricingContributor;
use App\Pricing\Contributors\OptionalFlatFeesPricingContributor;
use App\Pricing\Contributors\OrderDiscountPricingContributor;
use App\Pricing\Contributors\OrderTaxPricingContributor;

/**
 * Runs pricing contributors in {@see PricingPipelinePhase} order and returns an immutable snapshot.
 */
final class OrderPricingPipeline
{
    public function __construct(
        private readonly FishLinesPricingContributor $fishLines,
        private readonly OptionalFlatFeesPricingContributor $flatFees,
        private readonly OrderDiscountPricingContributor $discounts,
        private readonly OrderTaxPricingContributor $tax,
        private readonly FinalizePricingContributor $finalize,
    ) {}

    public static function default(): self
    {
        return new self(
            new FishLinesPricingContributor(new FishOrderLinesCalculator),
            new OptionalFlatFeesPricingContributor,
            new OrderDiscountPricingContributor,
            new OrderTaxPricingContributor,
            new FinalizePricingContributor,
        );
    }

    public function run(PricingContext $context): OrderPricingSnapshot
    {
        $ledger = new PricingLedger;

        // PricingPipelinePhase::CoreLines
        $this->fishLines->contribute($ledger, $context);
        // PricingPipelinePhase::FeeAdjustments
        $this->flatFees->contribute($ledger, $context);
        // PricingPipelinePhase::Discounts
        $this->discounts->contribute($ledger, $context);
        // PricingPipelinePhase::Tax
        $this->tax->contribute($ledger, $context);
        // PricingPipelinePhase::Finalize
        $this->finalize->contribute($ledger, $context);

        return $ledger->toSnapshot();
    }
}
