<?php

declare(strict_types=1);

namespace App\States\Order\Transitions;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\States\Order\OrderDelivered;
use Spatie\ModelStates\Transition;

final class ToDelivered extends Transition
{
    public function __construct(
        private readonly Order $order,
        private readonly ?User $actor = null,
    ) {}

    public function handle(OrderNotifier $notifier): Order
    {
        $this->order->status = new OrderDelivered($this->order);
        $this->order->save();

        $this->order->statusLogs()->create([
            'status' => OrderDelivered::$name,
            'user_id' => $this->actor?->id,
        ]);

        $notifier->notifyStatusChanged($this->order);
        $notifier->sendReceipt($this->order);
        $notifier->sendReviewInvite($this->order);

        return $this->order;
    }
}
