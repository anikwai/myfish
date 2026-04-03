<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PricingUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'price_per_pound' => ['required', 'numeric', 'min:0'],
            'filleting_fee' => ['required', 'numeric', 'min:0'],
            'delivery_fee' => ['required', 'numeric', 'min:0'],
            'kg_to_lbs_rate' => ['required', 'numeric', 'min:0'],
            'species_prices' => ['sometimes', 'array'],
            'species_prices.*' => ['nullable', 'numeric', 'min:0'],
            'discount_mode' => ['required', 'string', Rule::in(['off', 'fixed', 'percent'])],
            'discount_fixed_sbd' => ['required', 'numeric', 'min:0'],
            'discount_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'discount_max_sbd' => ['nullable', 'numeric', 'min:0'],
            'discount_min_order_sbd' => ['nullable', 'numeric', 'min:0'],
            'tax_mode' => ['required', 'string', Rule::in(['off', 'percent'])],
            'tax_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'tax_label' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $mode = $this->input('discount_mode');
            if ($mode === 'fixed' && (float) $this->input('discount_fixed_sbd') <= 0) {
                $v->errors()->add('discount_fixed_sbd', 'Enter a fixed amount greater than zero or set discount to off.');
            }
            if ($mode === 'percent' && (float) $this->input('discount_percent') <= 0) {
                $v->errors()->add('discount_percent', 'Enter a percent greater than zero or set discount to off.');
            }
            if ($this->input('tax_mode') === 'percent' && (float) $this->input('tax_percent') <= 0) {
                $v->errors()->add('tax_percent', 'Enter a tax percent greater than zero or set tax to off.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('discount_mode')) {
            $this->merge([
                'discount_mode' => 'off',
                'discount_fixed_sbd' => 0,
                'discount_percent' => 0,
                'discount_max_sbd' => null,
                'discount_min_order_sbd' => null,
            ]);
        }

        foreach (['discount_max_sbd', 'discount_min_order_sbd'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if (! $this->has('tax_mode')) {
            $this->merge([
                'tax_mode' => 'off',
                'tax_percent' => 0,
                'tax_label' => null,
            ]);
        }

        if ($this->has('tax_label') && $this->input('tax_label') === '') {
            $this->merge(['tax_label' => null]);
        }

        $species = $this->input('species_prices');

        if (! is_array($species)) {
            return;
        }

        $normalized = [];

        foreach ($species as $id => $value) {
            $normalized[$id] = $value === '' || $value === null ? null : $value;
        }

        $this->merge(['species_prices' => $normalized]);
    }
}
