<?php

namespace App\Values;

use App\Models\Business;
use App\Models\Setting;

final readonly class BusinessConfig
{
    public function __construct(
        public string $name,
        public string $address,
        public string $phone,
        public string $email,
        public ?string $logo_url = null,
    ) {}

    public static function current(): self
    {
        $business = Business::instance();
        $logoUrl = $business->getFirstMediaUrl('logo') ?: null;

        return new self(
            name: Setting::getString('business_name', 'TZ Holding Ltd'),
            address: Setting::getString('business_address', ''),
            phone: Setting::getString('business_phone', ''),
            email: Setting::getString('business_email', ''),
            logo_url: $logoUrl,
        );
    }

    /**
     * @return array{name: string, address: string, phone: string, email: string, logo_url: string|null}
     */
    public function toInertiaProps(): array
    {
        return [
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'logo_url' => $this->logo_url,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function saveFromValidated(array $data): void
    {
        $fields = [
            'business_name' => $data['business_name'] ?? '',
            'business_address' => $data['business_address'] ?? '',
            'business_phone' => $data['business_phone'] ?? '',
            'business_email' => $data['business_email'] ?? '',
        ];

        foreach ($fields as $key => $value) {
            $trimmed = trim((string) $value);

            if ($trimmed === '') {
                if ($key === 'business_name') {
                    Setting::setString($key, 'TZ Holding Ltd');
                } else {
                    Setting::remove($key);
                }
            } else {
                Setting::setString($key, mb_substr($trimmed, 0, 255));
            }
        }
    }
}
