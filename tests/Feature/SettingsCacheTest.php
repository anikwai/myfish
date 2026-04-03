<?php

use App\Models\Setting;
use App\Values\DiscountConfig;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    Cache::flush();
    DB::flushQueryLog();
    DB::enableQueryLog();
});

test('all config values are loaded in a single settings query per request', function (): void {
    defaultPricing();
    DB::flushQueryLog();

    PricingConfig::current();
    DiscountConfig::current();
    TaxConfig::current();

    $settingQueries = collect(DB::getQueryLog())
        ->filter(fn ($q) => str_contains($q['query'], 'settings'))
        ->count();

    expect($settingQueries)->toBe(1);
});

test('repeated calls to PricingConfig::current() within a request do not issue additional queries', function (): void {
    defaultPricing();
    DB::flushQueryLog();

    PricingConfig::current();
    PricingConfig::current();
    PricingConfig::current();

    $settingQueries = collect(DB::getQueryLog())
        ->filter(fn ($q) => str_contains($q['query'], 'settings'))
        ->count();

    expect($settingQueries)->toBe(1);
});

test('after Setting::set the next read returns the updated value', function (): void {
    defaultPricing(pricePerPound: 25.00);

    Setting::set('price_per_pound', 99.00);

    expect(PricingConfig::current()->pricePerPound)->toBe(99.0);
});

test('after Setting::setString the next read returns the updated value', function (): void {
    Setting::setString('tax_label', 'VAT');
    expect(Setting::getString('tax_label'))->toBe('VAT');

    Setting::setString('tax_label', 'GST');
    expect(Setting::getString('tax_label'))->toBe('GST');
});

test('after Setting::remove the key is no longer present', function (): void {
    Setting::set('discount_max_sbd', 50.0);
    expect(Setting::has('discount_max_sbd'))->toBeTrue();

    Setting::remove('discount_max_sbd');
    expect(Setting::has('discount_max_sbd'))->toBeFalse();
});

test('DiscountConfig removes optional fields through cache when cleared', function (): void {
    DiscountConfig::saveFromValidated([
        'discount_mode' => 'percent',
        'discount_percent' => 10,
        'discount_fixed_sbd' => 0,
        'discount_max_sbd' => '20',
        'discount_min_order_sbd' => '50',
    ]);

    $config = DiscountConfig::current();
    expect($config->maxSbd)->toBe(20.0);
    expect($config->minOrderSbd)->toBe(50.0);

    DiscountConfig::saveFromValidated([
        'discount_mode' => 'percent',
        'discount_percent' => 10,
        'discount_fixed_sbd' => 0,
        'discount_max_sbd' => null,
        'discount_min_order_sbd' => null,
    ]);

    $config = DiscountConfig::current();
    expect($config->maxSbd)->toBeNull();
    expect($config->minOrderSbd)->toBeNull();
});
