<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Review;

final readonly class DeleteReview
{
    public function handle(Review $review): void
    {
        $review->delete();
    }
}
