<?php

namespace App\Http\Controllers;

use App\Actions\SubmitOrderReview;
use App\Exceptions\OrderAlreadyReviewedException;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function __construct(private readonly SubmitOrderReview $submitOrderReview) {}

    public function show(Request $request, Order $order): Response
    {
        abort_unless($request->hasValidSignature(), 403);

        $expires = now()->addDays(30);

        return Inertia::render('orders/review', [
            'order' => [
                'id' => $order->id,
                'customer_name' => $order->customerName(),
            ],
            'already_reviewed' => $order->review()->exists(),
            'store_url' => URL::temporarySignedRoute('reviews.store', $expires, ['order' => $order->id]),
        ]);
    }

    public function store(StoreReviewRequest $request, Order $order): RedirectResponse
    {
        abort_unless($request->hasValidSignature(), 403);

        try {
            $this->submitOrderReview->handle($order, $request->validated('rating'), $request->validated('comment'));
        } catch (OrderAlreadyReviewedException) {
            return redirect()->back();
        }

        return redirect()->back()->with('status', 'review-submitted');
    }
}
