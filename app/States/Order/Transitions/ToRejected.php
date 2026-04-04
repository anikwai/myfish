<?php

declare(strict_types=1);

namespace App\States\Order\Transitions;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderNotifier;
use App\States\Order\OrderRejected;
use Spatie\ModelStates\Transition;

final class ToRejected extends Transition
{
    public function __construct(
        private readonly Order $order,
        private readonly ?string $rejectionReason = null,
        private readonly ?User $actor = null,
    ) {}

    public function handle(): Order
    {
        $this->order->status = new OrderRejected($this->order);
        $this->order->rejection_reason = $this->rejectionReason;
        $this->order->save();

        $this->order->statusLogs()->create([
            'status' => OrderRejected::$name,
            'user_id' => $this->actor?->id,
        ]);

        app(OrderNotifier::class)->notifyStatusChanged($this->order);

        return $this->order;
    }
}
