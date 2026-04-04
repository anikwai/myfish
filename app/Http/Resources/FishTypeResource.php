<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class FishTypeResource extends JsonApiResource
{
    public function toAttributes(Request $request): array
    {
        return [
            'name' => $this->name,
            'price_per_pound' => $this->price_per_pound,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}
