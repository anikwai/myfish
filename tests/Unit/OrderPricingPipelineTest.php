<?php

use App\Enums\DiscountMode;
use App\Enums\TaxMode;
use App\Models\FishType;
use App\Models\Setting;
use App\Pricing\Contributors\FinalizePricingContributor;
use App\Pricing\Contributors\FishLinesPricingContributor;
use App\Pricing\Contributors\OptionalFlatFeesPricingContributor;
use App\Pricing\Contributors\OrderDiscountPricingContributor;
use App\Pricing\Contributors\OrderTaxPricingContributor;
use App\Pricing\FishOrderLinesCalculator;
use App\Pricing\OrderPricingPipeline;
use App\Pricing\PricingContext;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('pipeline matches single species order totals at default pricing', function (): void {
    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => null]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $snapshot = OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 2.0]],
        new Collection([1 => $tuna]),
        filleting: false,
        delivery: false,
    ));

    expect($snapshot->grandTotalSbd)->toBe(110.23);
    expect($snapshot->fishSubtotalSbd)->toBe(110.23);
    expect($snapshot->discountSbd)->toBe(0.0);
    expect($snapshot->taxSbd)->toBe(0.0);
    expect($snapshot->orderItemPayloads)->toHaveCount(1);
    expect((float) $snapshot->orderItemPayloads[0]['subtotal_sbd'])->toBe(110.23);
});

test('pipeline adds optional flat fees after fish subtotal', function (): void {
    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => null]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $snapshot = OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 2.0]],
        new Collection([1 => $tuna]),
        filleting: true,
        delivery: true,
    ));

    expect($snapshot->fishSubtotalSbd)->toBe(110.23);
    expect($snapshot->discountSbd)->toBe(0.0);
    expect($snapshot->taxSbd)->toBe(0.0);
    expect($snapshot->grandTotalSbd)->toBe(125.23);
});

test('pipeline applies species override per line', function (): void {
    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => 60.0]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $snapshot = OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 1.0]],
        new Collection([1 => $tuna]),
        filleting: false,
        delivery: false,
    ));

    expect($snapshot->grandTotalSbd)->toBe(132.30);
    expect($snapshot->taxSbd)->toBe(0.0);
    expect((float) $snapshot->orderItemPayloads[0]['price_per_pound_snapshot'])->toBe(60.0);
});

test('pipeline rejects unknown fish type id', function (): void {
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    expect(fn () => OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 999, 'quantity_kg' => 1.0]],
        new Collection,
        filleting: false,
        delivery: false,
    )))->toThrow(InvalidArgumentException::class);
});

test('pipeline applies injected fixed discount after fees', function (): void {
    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => null]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $pipeline = new OrderPricingPipeline(
        new FishLinesPricingContributor(new FishOrderLinesCalculator),
        new OptionalFlatFeesPricingContributor,
        new OrderDiscountPricingContributor(new DiscountConfig(
            DiscountMode::Fixed,
            fixedSbd: 10.0,
            percent: 0.0,
            maxSbd: null,
            minOrderSbd: null,
        )),
        new OrderTaxPricingContributor(new TaxConfig(TaxMode::Off, 0.0, 'Tax')),
        new FinalizePricingContributor,
    );

    $snapshot = $pipeline->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 2.0]],
        new Collection([1 => $tuna]),
        filleting: true,
        delivery: true,
    ));

    expect($snapshot->fishSubtotalSbd)->toBe(110.23);
    expect($snapshot->discountSbd)->toBe(10.0);
    expect($snapshot->taxSbd)->toBe(0.0);
    expect($snapshot->grandTotalSbd)->toBe(115.23);
});

test('pipeline applies fixed discount from settings', function (): void {
    Setting::set('discount_mode', 1.0);
    Setting::set('discount_fixed_sbd', 10.0);
    Setting::set('discount_percent', 0.0);

    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => null]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $snapshot = OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 2.0]],
        new Collection([1 => $tuna]),
        filleting: true,
        delivery: true,
    ));

    expect($snapshot->discountSbd)->toBe(10.0);
    expect($snapshot->taxSbd)->toBe(0.0);
    expect($snapshot->grandTotalSbd)->toBe(115.23);
});

test('pipeline applies exclusive percent tax from settings', function (): void {
    Setting::set('tax_mode', 1.0);
    Setting::set('tax_percent', 10.0);

    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => null]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $snapshot = OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 2.0]],
        new Collection([1 => $tuna]),
        filleting: false,
        delivery: false,
    ));

    expect($snapshot->discountSbd)->toBe(0.0);
    expect($snapshot->taxSbd)->toBe(11.02);
    expect($snapshot->grandTotalSbd)->toBe(121.25);
});

test('pipeline applies tax on subtotal after discount', function (): void {
    Setting::set('discount_mode', 1.0);
    Setting::set('discount_fixed_sbd', 10.0);
    Setting::set('discount_percent', 0.0);
    Setting::set('tax_mode', 1.0);
    Setting::set('tax_percent', 10.0);

    $tuna = new FishType(['id' => 1, 'name' => 'Tuna', 'price_per_pound' => null]);
    $pricing = new PricingConfig(25.0, 10.0, 5.0, 2.20462);

    $snapshot = OrderPricingPipeline::default()->run(new PricingContext(
        $pricing,
        [['fish_type_id' => 1, 'quantity_kg' => 2.0]],
        new Collection([1 => $tuna]),
        filleting: true,
        delivery: true,
    ));

    expect($snapshot->discountSbd)->toBe(10.0);
    expect($snapshot->taxSbd)->toBe(11.52);
    expect($snapshot->grandTotalSbd)->toBe(126.75);
});
