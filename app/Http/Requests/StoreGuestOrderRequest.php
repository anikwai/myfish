<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuestOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'string', 'email', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.fish_type_id' => ['required', 'integer', Rule::exists('fish_types', 'id')->where('is_active', true)],
            'items.*.cut' => ['nullable', 'string', Rule::in(['whole', 'fillet', 'steak'])],
            'items.*.quantity_kg' => ['required', 'numeric', 'min:0.001'],
            'filleting' => ['required', 'boolean'],
            'delivery' => ['required', 'boolean'],
            'delivery_location' => ['required_if:delivery,true', 'nullable', 'string', 'max:255'],
        ];
    }
}
