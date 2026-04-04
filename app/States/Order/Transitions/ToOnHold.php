<?php

declare(strict_types=1);

namespace App\States\Order\Transitions;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\States\Order\OrderOnHold;
use Spatie\ModelStates\Transition;

final class ToOnHold extends Transition
{
    public function __construct(
        private readonly Order $order,
        private readonly ?User $actor = null,
    ) {}

    public function handle(): Order
    {
        $this->order->status = new OrderOnHold($this->order);
        $this->order->save();

        $this->order->statusLogs()->create([
            'status' => OrderOnHold::$name,
            'user_id' => $this->actor?->id,
        ]);

        app(OrderNotifier::class)->notifyStatusChanged($this->order);

        return $this->order;
    }
}
