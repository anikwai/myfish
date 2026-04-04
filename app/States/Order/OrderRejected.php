<?php

declare(strict_types=1);

namespace App\States\Order;

final class OrderRejected extends OrderState
{
    public static string $name = 'rejected';

    public function label(): string
    {
        return 'Rejected';
    }

    public function color(): string
    {
        return 'bg-red-100 text-red-700';
    }
}
