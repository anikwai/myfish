<?php

namespace App\Pricing\Contributors;

use App\Pricing\PricingContext;
use App\Pricing\PricingContributor;
use App\Pricing\PricingLedger;
use App\Values\TaxConfig;

/**
 * Exclusive tax on the order subtotal after discount.
 */
final class OrderTaxPricingContributor implements PricingContributor
{
    public function __construct(
        private readonly ?TaxConfig $taxConfig = null,
    ) {}

    public function contribute(PricingLedger $ledger, PricingContext $context): void
    {
        $config = $this->taxConfig ?? TaxConfig::current();
        $base = $ledger->taxableExclusiveSubtotal();
        $ledger->applyTax($config->amountOn($base));
    }
}
