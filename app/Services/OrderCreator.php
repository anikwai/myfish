<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\Values\PricingConfig;
use Illuminate\Support\Facades\DB;

final class OrderCreator implements OrderCreatorInterface
{
    private const KG_TO_LBS = 2.20462;

    public function placeForUser(
        User $user,
        array $items,
        bool $filleting,
        bool $delivery,
        ?string $deliveryLocation = null,
    ): Order {
        return $this->place(
            identity: ['user_id' => $user->id],
            items: $items,
            filleting: $filleting,
            delivery: $delivery,
            deliveryLocation: $deliveryLocation,
        );
    }

    public function placeForGuest(
        string $guestName,
        ?string $guestEmail,
        string $guestPhone,
        array $items,
        bool $filleting,
        bool $delivery,
        ?string $deliveryLocation = null,
    ): Order {
        return $this->place(
            identity: ['user_id' => null, 'guest_name' => $guestName, 'guest_email' => $guestEmail, 'guest_phone' => $guestPhone],
            items: $items,
            filleting: $filleting,
            delivery: $delivery,
            deliveryLocation: $deliveryLocation,
        );
    }

    /**
     * @param  array<string, mixed>  $identity
     * @param  array<int, array{fish_type_id: int, quantity_kg: float}>  $items
     */
    private function place(
        array $identity,
        array $items,
        bool $filleting,
        bool $delivery,
        ?string $deliveryLocation,
    ): Order {
        $pricing = PricingConfig::current();

        $totalPounds = 0;
        $itemsToCreate = [];

        foreach ($items as $item) {
            $pounds = round($item['quantity_kg'] * self::KG_TO_LBS, 3);
            $subtotal = round($pounds * $pricing->pricePerPound, 2);
            $totalPounds += $pounds;

            $itemsToCreate[] = [
                'fish_type_id' => $item['fish_type_id'],
                'quantity_kg' => $item['quantity_kg'],
                'quantity_pounds' => $pounds,
                'subtotal_sbd' => $subtotal,
            ];
        }

        $total = round($totalPounds * $pricing->pricePerPound, 2);

        if ($filleting) {
            $total += $pricing->filletingFee;
        }

        if ($delivery) {
            $total += $pricing->deliveryFee;
        }

        $order = DB::transaction(function () use ($identity, $pricing, $filleting, $delivery, $deliveryLocation, $total, $itemsToCreate): Order {
            $order = Order::create([
                ...$identity,
                'status' => 'placed',
                'price_per_pound_snapshot' => $pricing->pricePerPound,
                'filleting_fee_snapshot' => $pricing->filletingFee,
                'delivery_fee_snapshot' => $pricing->deliveryFee,
                'filleting' => $filleting,
                'delivery' => $delivery,
                'delivery_location' => $deliveryLocation,
                'total_sbd' => $total,
            ]);

            $order->items()->createMany($itemsToCreate);

            return $order;
        });

        app(OrderNotifier::class)->orderPlaced($order);

        return $order;
    }
}
