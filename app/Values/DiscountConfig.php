<?php

namespace App\Values;

use App\Enums\DiscountMode;
use App\Models\Setting;

final readonly class DiscountConfig
{
    public function __construct(
        public DiscountMode $mode,
        public float $fixedSbd,
        public float $percent,
        public ?float $maxSbd,
        public ?float $minOrderSbd,
    ) {}

    public static function current(): self
    {
        $mode = DiscountMode::tryFrom((int) Setting::get('discount_mode', 0)) ?? DiscountMode::Off;

        return new self(
            mode: $mode,
            fixedSbd: Setting::get('discount_fixed_sbd', 0),
            percent: Setting::get('discount_percent', 0),
            maxSbd: Setting::has('discount_max_sbd') ? Setting::get('discount_max_sbd') : null,
            minOrderSbd: Setting::has('discount_min_order_sbd') ? Setting::get('discount_min_order_sbd') : null,
        );
    }

    /**
     * @return array{
     *     mode: string,
     *     fixed_sbd: float,
     *     percent: float,
     *     max_sbd: float|null,
     *     min_order_sbd: float|null,
     * }
     */
    public function toInertiaProps(): array
    {
        return [
            'mode' => match ($this->mode) {
                DiscountMode::Off => 'off',
                DiscountMode::Fixed => 'fixed',
                DiscountMode::Percent => 'percent',
            },
            'fixed_sbd' => $this->fixedSbd,
            'percent' => $this->percent,
            'max_sbd' => $this->maxSbd,
            'min_order_sbd' => $this->minOrderSbd,
        ];
    }

    /**
     * Discount applied to the order subtotal (fish + selected flat fees), before tax.
     */
    public function amountOff(float $orderSubtotalBeforeDiscount): float
    {
        if ($this->mode === DiscountMode::Off) {
            return 0.0;
        }

        $base = round($orderSubtotalBeforeDiscount, 2);

        if ($this->minOrderSbd !== null && $base < round($this->minOrderSbd, 2)) {
            return 0.0;
        }

        $raw = match ($this->mode) {
            DiscountMode::Fixed => min($this->fixedSbd, $base),
            DiscountMode::Percent => round($base * ($this->percent / 100.0), 2),
            default => 0.0,
        };

        if ($this->maxSbd !== null) {
            $raw = min($raw, $this->maxSbd);
        }

        $raw = min($raw, $base);

        return round(max(0.0, $raw), 2);
    }

    /**
     * Persist discount settings from validated admin input.
     *
     * @param  array<string, mixed>  $data
     */
    public static function saveFromValidated(array $data): void
    {
        $mode = match ($data['discount_mode'] ?? 'off') {
            'fixed' => DiscountMode::Fixed,
            'percent' => DiscountMode::Percent,
            default => DiscountMode::Off,
        };

        Setting::set('discount_mode', (float) $mode->value);
        Setting::set('discount_fixed_sbd', (float) ($data['discount_fixed_sbd'] ?? 0));
        Setting::set('discount_percent', (float) ($data['discount_percent'] ?? 0));

        foreach (
            [
                'discount_max_sbd' => 'discount_max_sbd',
                'discount_min_order_sbd' => 'discount_min_order_sbd',
            ] as $inputKey => $settingKey
        ) {
            $v = $data[$inputKey] ?? null;
            if ($v === null || $v === '') {
                Setting::remove($settingKey);
            } else {
                Setting::set($settingKey, (float) $v);
            }
        }
    }
}
