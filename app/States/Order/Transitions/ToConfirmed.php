<?php

declare(strict_types=1);

namespace App\States\Order\Transitions;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\States\Order\OrderConfirmed;
use Spatie\ModelStates\Transition;

final class ToConfirmed extends Transition
{
    public function __construct(
        private readonly Order $order,
        private readonly ?User $actor = null,
    ) {}

    public function handle(): Order
    {
        $this->order->status = new OrderConfirmed($this->order);
        $this->order->save();

        $this->order->statusLogs()->create([
            'status' => OrderConfirmed::$name,
            'user_id' => $this->actor?->id,
        ]);

        $notifier = app(OrderNotifier::class);
        $notifier->notifyStatusChanged($this->order);
        $notifier->sendInvoice($this->order);

        return $this->order;
    }
}
