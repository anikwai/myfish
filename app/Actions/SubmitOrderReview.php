<?php

declare(strict_types=1);

namespace App\Actions;

use App\Exceptions\OrderAlreadyReviewedException;
use App\Models\Order;
use App\Models\Review;

final readonly class SubmitOrderReview
{
    public function handle(Order $order, int $rating, ?string $comment): Review
    {
        if ($order->review()->exists()) {
            throw OrderAlreadyReviewedException::forOrder($order->id);
        }

        $reviewerName = $order->user
            ? explode(' ', $order->user->name)[0]
            : explode(' ', $order->guest_name ?? 'Customer')[0];

        return $order->review()->create([
            'rating' => $rating,
            'comment' => $comment,
            'reviewer_name' => $reviewerName,
        ]);
    }
}
