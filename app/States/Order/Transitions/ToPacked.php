<?php

declare(strict_types=1);

namespace App\States\Order\Transitions;

use App\Actions\DeductOrderFromInventory;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\States\Order\OrderPacked;
use Spatie\ModelStates\Transition;

final class ToPacked extends Transition
{
    public function __construct(
        private readonly Order $order,
        private readonly ?User $actor = null,
    ) {}

    public function handle(): Order
    {
        $this->order->status = new OrderPacked($this->order);
        $this->order->save();

        $this->order->statusLogs()->create([
            'status' => OrderPacked::$name,
            'user_id' => $this->actor?->id,
        ]);

        app(DeductOrderFromInventory::class)->execute($this->order, $this->actor?->id ?? 0);
        app(OrderNotifier::class)->notifyStatusChanged($this->order);

        return $this->order;
    }
}
