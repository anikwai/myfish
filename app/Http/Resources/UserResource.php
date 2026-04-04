<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class UserResource extends JsonApiResource
{
    /**
     * Get the resource's attributes.
     *
     * @return array<string, mixed>
     */
    public function toAttributes(Request $request): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_email_verified' => $this->email_verified_at !== null,
            'has_two_factor_enabled' => $this->two_factor_confirmed_at !== null,
            'created_at' => $this->created_at,
        ];
    }
}
