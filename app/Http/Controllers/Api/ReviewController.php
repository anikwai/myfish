<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/** @group Reviews */
class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request, Order $order): JsonResponse
    {
        Gate::authorize('view', $order);

        if ($order->status !== 'delivered') {
            throw ValidationException::withMessages([
                'order' => ['This order has not been delivered yet.'],
            ]);
        }

        if ($order->review()->exists()) {
            throw ValidationException::withMessages([
                'order' => ['A review has already been submitted for this order.'],
            ]);
        }

        $reviewerName = explode(' ', $order->user->name)[0];

        $review = $order->review()->create([
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'reviewer_name' => $reviewerName,
        ]);

        return (new ReviewResource($review))
            ->response()
            ->setStatusCode(201);
    }
}
