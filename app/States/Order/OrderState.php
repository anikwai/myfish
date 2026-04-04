<?php

declare(strict_types=1);

namespace App\States\Order;

use App\States\Order\Transitions\ToConfirmed;
use App\States\Order\Transitions\ToDelivered;
use App\States\Order\Transitions\ToOnHold;
use App\States\Order\Transitions\ToPacked;
use App\States\Order\Transitions\ToRejected;
use Spatie\ModelStates\Attributes\AllowTransition;
use Spatie\ModelStates\State;

#[AllowTransition(OrderPlaced::class, OrderConfirmed::class, ToConfirmed::class)]
#[AllowTransition(OrderPlaced::class, OrderOnHold::class, ToOnHold::class)]
#[AllowTransition(OrderPlaced::class, OrderRejected::class, ToRejected::class)]
#[AllowTransition(OrderOnHold::class, OrderConfirmed::class, ToConfirmed::class)]
#[AllowTransition(OrderOnHold::class, OrderRejected::class, ToRejected::class)]
#[AllowTransition(OrderConfirmed::class, OrderPacked::class, ToPacked::class)]
#[AllowTransition(OrderPacked::class, OrderDelivered::class, ToDelivered::class)]
abstract class OrderState extends State
{
    abstract public function label(): string;

    abstract public function color(): string;

    /**
     * Resolve a state FQCN from its string name.
     */
    public static function classFromName(string $name): string
    {
        return match ($name) {
            'placed' => OrderPlaced::class,
            'confirmed' => OrderConfirmed::class,
            'on_hold' => OrderOnHold::class,
            'rejected' => OrderRejected::class,
            'packed' => OrderPacked::class,
            'delivered' => OrderDelivered::class,
            default => throw new \InvalidArgumentException("Unknown order state: {$name}"),
        };
    }

    /**
     * All valid order status names.
     *
     * @return string[]
     */
    public static function allNames(): array
    {
        return ['placed', 'confirmed', 'on_hold', 'rejected', 'packed', 'delivered'];
    }

    /**
     * String names of states this state can transition to.
     *
     * @return string[]
     */
    public function transitionableNames(): array
    {
        return $this->transitionableStates();
    }

    /**
     * Map of all status names to their label and color, for Inertia props.
     *
     * @return array<string, array{label: string, color: string}>
     */
    public static function metaMap(): array
    {
        $classes = [
            OrderPlaced::class,
            OrderConfirmed::class,
            OrderOnHold::class,
            OrderRejected::class,
            OrderPacked::class,
            OrderDelivered::class,
        ];

        $map = [];

        foreach ($classes as $class) {
            $instance = new $class(null);
            $map[$class::$name] = [
                'label' => $instance->label(),
                'color' => $instance->color(),
            ];
        }

        return $map;
    }
}
