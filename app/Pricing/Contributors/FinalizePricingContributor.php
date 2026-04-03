<?php

namespace App\Pricing\Contributors;

use App\Pricing\PricingContext;
use App\Pricing\PricingContributor;
use App\Pricing\PricingLedger;
use App\Pricing\PricingPipelinePhase;

/**
 * {@see PricingPipelinePhase::Finalize} — last chance for rounding policy or FX before snapshot.
 */
final class FinalizePricingContributor implements PricingContributor
{
    public function contribute(PricingLedger $ledger, PricingContext $context): void
    {
        // Totals match historical behavior: fish subtotal rounded in ledger, fees added without extra final round.
    }
}
