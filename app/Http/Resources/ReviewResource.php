<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class ReviewResource extends JsonApiResource
{
    public function toAttributes(Request $request): array
    {
        return [
            'order_id' => $this->order_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'reviewer_name' => $this->reviewer_name,
            'created_at' => $this->created_at,
        ];
    }
}
