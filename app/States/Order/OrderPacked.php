<?php

declare(strict_types=1);

namespace App\States\Order;

final class OrderPacked extends OrderState
{
    public static string $name = 'packed';

    public function label(): string
    {
        return 'Packed';
    }

    public function color(): string
    {
        return 'bg-purple-100 text-purple-700';
    }

    public function icon(): string
    {
        return 'Package01Icon';
    }
}
