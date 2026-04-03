<?php

namespace App\Enums;

enum WeightUnit
{
    case Kg;
    case Lbs;

    public function convertTo(self $target, float $value, float $rate): float
    {
        return match ([$this, $target]) {
            [self::Kg, self::Lbs] => $value * $rate,
            [self::Lbs, self::Kg] => $value / $rate,
            default => $value,
        };
    }
}
