<?php

declare(strict_types=1);

namespace App\States\Order;

final class OrderDelivered extends OrderState
{
    public static string $name = 'delivered';

    public function label(): string
    {
        return 'Delivered';
    }

    public function color(): string
    {
        return 'bg-neutral-100 text-neutral-600';
    }

    public function icon(): string
    {
        return 'PackageDelivered01Icon';
    }
}
