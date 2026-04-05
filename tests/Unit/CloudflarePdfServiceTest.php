<?php

use App\Services\CloudflarePdfService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function (): void {
    Sleep::fake(false);
});

test('returns pdf body on first successful response', function (): void {
    Sleep::fake();

    Http::fake([
        '*' => Http::response('%PDF-ok', 200, ['Content-Type' => 'application/pdf']),
    ]);

    $svc = new CloudflarePdfService('acct', 'tok');
    expect($svc->generate('<html></html>'))->toBe('%PDF-ok');

    Sleep::assertNeverSlept();
});

test('throws immediately on HTTP 429 without retrying', function (): void {
    Sleep::fake();

    $calls = 0;
    Http::fake(function () use (&$calls) {
        $calls++;

        return Http::response(
            json_encode(['success' => false, 'errors' => [['code' => 2001, 'message' => 'Rate limit exceeded']]]),
            429,
        );
    });

    $svc = new CloudflarePdfService('acct', 'tok');

    expect(fn () => $svc->generate('<html></html>'))
        ->toThrow(RequestException::class);

    expect($calls)->toBe(1);
    Sleep::assertNeverSlept();
});

test('retries on 5xx server error then returns pdf body', function (): void {
    Sleep::fake();

    $calls = 0;
    Http::fake(function () use (&$calls) {
        $calls++;
        if ($calls === 1) {
            return Http::response('Server Error', 503);
        }

        return Http::response('%PDF-retry', 200, ['Content-Type' => 'application/pdf']);
    });

    $svc = new CloudflarePdfService('acct', 'tok');
    expect($svc->generate('<html></html>'))->toBe('%PDF-retry');
    expect($calls)->toBe(2);
    Sleep::assertSleptTimes(1);
});
