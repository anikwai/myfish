<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

class CloudflarePdfService
{
    private const int MAX_ATTEMPTS = 6;

    public function __construct(
        private readonly string $accountId,
        private readonly string $token,
    ) {}

    /**
     * Generate a PDF from the given HTML string and return raw binary content.
     *
     * Cloudflare Browser Rendering enforces a low rate limit; invoice + receipt PDFs
     * in quick succession often return HTTP 429. We retry with backoff when that happens.
     *
     * @throws RequestException
     */
    public function generate(string $html): string
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/browser-rendering/pdf";

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $response = Http::withToken($this->token)
                ->timeout(60)
                ->post($url, ['html' => $html]);

            if ($response->successful()) {
                return $response->body();
            }

            // 429 means rate-limited — throw immediately so the queued job's
            // own backoff schedule (15 → 45 → 90 → 180 s) handles the retry.
            // Only retry internally for transient 5xx server errors.
            if ($response->serverError() && $attempt < self::MAX_ATTEMPTS) {
                Sleep::sleep(min(30, 2 ** $attempt));

                continue;
            }

            $response->throw();
        }

        throw new \LogicException('Cloudflare PDF: retry loop exited unexpectedly.');
    }
}
