<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function show(Request $request, Order $order): Response
    {
        abort_unless($request->hasValidSignature(), 403);

        return Inertia::render('orders/review', [
            'order' => [
                'id' => $order->id,
                'customer_name' => $order->customerName(),
            ],
            'already_reviewed' => $order->review()->exists(),
        ]);
    }

    public function store(StoreReviewRequest $request, Order $order): RedirectResponse
    {
        abort_unless($request->hasValidSignature(), 403);

        if ($order->review()->exists()) {
            return redirect()->back();
        }

        $reviewerName = $order->user
            ? explode(' ', $order->user->name)[0]
            : explode(' ', $order->guest_name ?? 'Customer')[0];

        $order->review()->create([
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'reviewer_name' => $reviewerName,
        ]);

        return redirect()->route('reviews.show', $order)
            ->with('status', 'review-submitted');
    }
}
