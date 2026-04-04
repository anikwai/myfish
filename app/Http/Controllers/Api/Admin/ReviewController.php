<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        $reviews = Review::with('order:id')
            ->latest()
            ->get(['id', 'order_id', 'reviewer_name', 'rating', 'comment', 'created_at']);

        return response()->json([
            'data' => $reviews,
            'stats' => [
                'average' => round((float) Review::avg('rating'), 1),
                'total' => Review::count(),
            ],
        ]);
    }

    public function destroy(Review $review): Response
    {
        $review->delete();

        return response()->noContent();
    }
}
