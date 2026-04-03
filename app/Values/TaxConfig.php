<?php

namespace App\Values;

use App\Enums\TaxMode;
use App\Models\Setting;

final readonly class TaxConfig
{
    public function __construct(
        public TaxMode $mode,
        public float $percent,
        public string $label,
    ) {}

    public static function current(): self
    {
        $mode = TaxMode::tryFrom((int) Setting::get('tax_mode', 0)) ?? TaxMode::Off;
        $label = self::normalizeLabel(Setting::getString('tax_label', ''));

        return new self(
            mode: $mode,
            percent: Setting::get('tax_percent', 0),
            label: $label,
        );
    }

    /**
     * Label shown on receipts and checkout when tax applies (snapshotted per order).
     */
    public function customerFacingLabel(): string
    {
        return $this->label;
    }

    /**
     * @return array{mode: string, percent: float, label: string}
     */
    public function toInertiaProps(): array
    {
        return [
            'mode' => match ($this->mode) {
                TaxMode::Off => 'off',
                TaxMode::Percent => 'percent',
            },
            'percent' => $this->percent,
            'label' => $this->label,
        ];
    }

    /**
     * Exclusive tax on the order subtotal after discount (fish + fees − discount).
     */
    public function amountOn(float $taxableExclusiveSubtotal): float
    {
        if ($this->mode === TaxMode::Off) {
            return 0.0;
        }

        $base = round($taxableExclusiveSubtotal, 2);

        return round($base * ($this->percent / 100.0), 2);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function saveFromValidated(array $data): void
    {
        $mode = match ($data['tax_mode'] ?? 'off') {
            'percent' => TaxMode::Percent,
            default => TaxMode::Off,
        };

        Setting::set('tax_mode', (float) $mode->value);
        Setting::set('tax_percent', (float) ($data['tax_percent'] ?? 0));

        if (array_key_exists('tax_label', $data)) {
            $labelInput = trim((string) $data['tax_label']);
            if ($labelInput === '') {
                Setting::remove('tax_label');
            } else {
                Setting::setString('tax_label', mb_substr($labelInput, 0, 100));
            }
        }
    }

    public static function normalizeLabel(?string $raw): string
    {
        $t = trim((string) $raw);

        return $t === '' ? 'Tax' : mb_substr($t, 0, 100);
    }
}
