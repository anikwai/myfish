<?php

namespace App\Services;

use App\Models\FishType;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\Pricing\OrderPricingPipeline;
use App\Pricing\PricingContext;
use App\Values\PricingConfig;
use App\Values\TaxConfig;
use Illuminate\Support\Facades\DB;

final class OrderCreator implements OrderCreatorInterface
{
    public function __construct(
        private readonly OrderPricingPipeline $pricingPipeline,
    ) {}

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
     * @param  array<int, array{fish_type_id: int, quantity_kg: float, cut?: string|null}>  $items
     */
    private function place(
        array $identity,
        array $items,
        bool $filleting,
        bool $delivery,
        ?string $deliveryLocation,
    ): Order {
        $pricing = PricingConfig::current();

        $fishTypeIds = array_values(array_unique(array_map(
            fn (array $item): int => (int) $item['fish_type_id'],
            $items,
        )));

        $fishTypes = FishType::query()
            ->whereIn('id', $fishTypeIds)
            ->get()
            ->keyBy('id');

        $snapshot = $this->pricingPipeline->run(new PricingContext(
            $pricing,
            $items,
            $fishTypes,
            $filleting,
            $delivery,
        ));

        $taxConfig = TaxConfig::current();

        $order = DB::transaction(function () use ($identity, $pricing, $filleting, $delivery, $deliveryLocation, $snapshot, $taxConfig): Order {
            $order = Order::create([
                ...$identity,
                'status' => 'placed',
                'filleting_fee_snapshot' => $pricing->filletingFee,
                'delivery_fee_snapshot' => $pricing->deliveryFee,
                'filleting' => $filleting,
                'delivery' => $delivery,
                'delivery_location' => $deliveryLocation,
                'discount_sbd' => $snapshot->discountSbd,
                'tax_sbd' => $snapshot->taxSbd,
                'tax_label_snapshot' => $taxConfig->customerFacingLabel(),
                'total_sbd' => $snapshot->grandTotalSbd,
            ]);

            $order->items()->createMany($snapshot->orderItemPayloads);
            $order->statusLogs()->create(['status' => 'placed', 'user_id' => null]);

            return $order;
        });

        app(OrderNotifier::class)->orderPlaced($order);

        return $order;
    }
}
