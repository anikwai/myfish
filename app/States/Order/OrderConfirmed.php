<?php

declare(strict_types=1);

namespace App\States\Order;

final class OrderConfirmed extends OrderState
{
    public static string $name = 'confirmed';

    public function label(): string
    {
        return 'Confirmed';
    }

    public function color(): string
    {
        return 'bg-green-100 text-green-700';
    }

    public function icon(): string
    {
        return 'CheckmarkCircle01Icon';
    }
}
