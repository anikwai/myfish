<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class OrderResource extends JsonApiResource
{
    /**
     * @return array<string, mixed>
     */
    public function toAttributes(Request $request): array
    {
        return [
            'status' => $this->status,
            'filleting' => $this->filleting,
            'delivery' => $this->delivery,
            'delivery_location' => $this->delivery_location,
            'note' => $this->note,
            'filleting_fee_snapshot' => $this->filleting_fee_snapshot,
            'delivery_fee_snapshot' => $this->delivery_fee_snapshot,
            'discount_sbd' => $this->discount_sbd,
            'tax_sbd' => $this->tax_sbd,
            'tax_label_snapshot' => $this->tax_label_snapshot,
            'total_sbd' => $this->total_sbd,
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toRelationships(Request $request): array
    {
        return [
            'items' => OrderItemResource::class,
            'statusLogs' => OrderStatusLogResource::class,
        ];
    }
}
