<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/reviews/index', [
            'reviews' => Review::with('order:id')->latest()->get([
                'id', 'order_id', 'reviewer_name', 'rating', 'comment', 'created_at',
            ]),
            'stats' => [
                'average' => round((float) Review::avg('rating'), 1),
                'total' => Review::count(),
            ],
        ]);
    }

    public function destroy(Review $review): RedirectResponse
    {
        $review->delete();

        return to_route('admin.reviews.index')->with('status', 'review-deleted');
    }
}
