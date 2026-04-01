<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;

interface OrderCreatorInterface
{
    /**
     * Place an order for an authenticated user.
     *
     * @param  array<int, array{fish_type_id: int, quantity_kg: float}>  $items
     */
    public function placeForUser(
        User $user,
        array $items,
        bool $filleting,
        bool $delivery,
        ?string $deliveryLocation = null,
    ): Order;

    /**
     * Place an order on behalf of a walk-in or online guest.
     *
     * @param  array<int, array{fish_type_id: int, quantity_kg: float}>  $items
     */
    public function placeForGuest(
        string $guestName,
        ?string $guestEmail,
        string $guestPhone,
        array $items,
        bool $filleting,
        bool $delivery,
        ?string $deliveryLocation = null,
    ): Order;
}
