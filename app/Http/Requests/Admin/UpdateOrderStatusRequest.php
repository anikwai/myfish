<?php

namespace App\Http\Requests\Admin;

use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'staff']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    /** @var Order $order */
                    $order = $this->route('order');
                    $allowed = Order::TRANSITIONS[$order->status] ?? [];

                    if (! in_array($value, $allowed, true)) {
                        $fail("Cannot transition from '{$order->status}' to '{$value}'.");
                    }
                },
            ],
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
