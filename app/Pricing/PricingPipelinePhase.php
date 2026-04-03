<?php

namespace App\Pricing;

/**
 * Ordered phases for order pricing.
 */
enum PricingPipelinePhase: string
{
    case CoreLines = 'core_lines';
    case FeeAdjustments = 'fee_adjustments';
    case Discounts = 'discounts';
    case Tax = 'tax';
    case Finalize = 'finalize';
}
