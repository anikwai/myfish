<?php

declare(strict_types=1);

namespace App\States\Order;

final class OrderPlaced extends OrderState
{
    public static string $name = 'placed';

    public function label(): string
    {
        return 'Placed';
    }

    public function color(): string
    {
        return 'bg-blue-100 text-blue-700';
    }

    public function icon(): string
    {
        return 'Clock01Icon';
    }
}
