<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class OrderItemResource extends JsonApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toAttributes(Request $request): array
    {
        return [
            'fish_type_id' => $this->fish_type_id,
            'fish_type_name' => $this->whenLoaded('fishType', fn () => $this->fishType->name),
            'cut' => $this->cut,
            'quantity_kg' => $this->quantity_kg,
            'quantity_pounds' => $this->quantity_pounds,
            'price_per_pound_snapshot' => $this->price_per_pound_snapshot,
            'subtotal_sbd' => $this->subtotal_sbd,
        ];
    }
}
