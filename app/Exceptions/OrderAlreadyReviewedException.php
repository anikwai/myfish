<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

final class OrderAlreadyReviewedException extends Exception
{
    public static function forOrder(int $orderId): self
    {
        return new self("Order #{$orderId} has already been reviewed.");
    }
}
