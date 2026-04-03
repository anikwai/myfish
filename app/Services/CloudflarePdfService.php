<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

class CloudflarePdfService
{
    public function __construct(
        private readonly string $accountId,
        private readonly string $token,
    ) {}

    /**
     * Generate a PDF from the given HTML string and return raw binary content.
     *
     * @throws RequestException
     */
    public function generate(string $html): string
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/browser-rendering/pdf";

        return Http::withToken($this->token)
            ->timeout(30)
            ->post($url, ['html' => $html])
            ->throw()
            ->body();
    }
}
