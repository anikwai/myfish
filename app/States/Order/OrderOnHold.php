<?php

declare(strict_types=1);

namespace App\States\Order;

final class OrderOnHold extends OrderState
{
    public static string $name = 'on_hold';

    public function label(): string
    {
        return 'On hold';
    }

    public function color(): string
    {
        return 'bg-yellow-100 text-yellow-700';
    }
}
