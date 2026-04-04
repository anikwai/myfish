<?php

use App\Listeners\ApplyBusinessNameToOutgoingMail;
use App\Models\Business;
use App\Models\Order;
use App\Models\User;
use App\Notifications\InvoiceNotification;
use App\Services\CloudflarePdfService;
use App\Support\BusinessMailBranding;
use Illuminate\Http\UploadedFile;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Mime\Email;

beforeEach(function (): void {
    $this->instance(CloudflarePdfService::class, new class extends CloudflarePdfService
    {
        public function __construct()
        {
            parent::__construct('stub-account', 'stub-token');
        }

        public function generate(string $html): string
        {
            return '%PDF-stub';
        }
    });
});

test('notification mail html uses business branding instead of laravel default logo', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    $html = (string) (new InvoiceNotification($order))->toMail($user)->render();

    expect($html)->not->toContain('laravel.com/img/notification-logo')
        ->and($html)->toContain('TZ Holding Ltd');
});

test('business mail branding embeds logo as cid when laravel mail message is provided', function () {
    Storage::fake('media');

    Business::instance()->addMedia(UploadedFile::fake()->image('logo.png', 40, 40))
        ->toMediaCollection('logo');

    $laravelMessage = new Message(new Email);

    expect(BusinessMailBranding::logoImgSrc($laravelMessage))->toStartWith('cid:');
});

test('business mail branding embeds svg logo as rasterized png cid when imagick can convert', function () {
    Storage::fake('media');

    $svg = '<?xml version="1.0" encoding="UTF-8"?>'
        .'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">'
        .'<rect width="40" height="40" fill="#c00"/></svg>';
    Business::instance()->addMedia(UploadedFile::fake()->createWithContent('logo.svg', $svg))
        ->toMediaCollection('logo');

    $laravelMessage = new Message(new Email);
    $src = BusinessMailBranding::logoImgSrc($laravelMessage);

    if (extension_loaded('imagick')) {
        expect($src)->toStartWith('cid:');
    } else {
        expect($src)->toBeNull();
    }
});

test('ApplyBusinessNameToOutgoingMail sets from display name from business config', function () {
    $email = (new Email)
        ->from('hello@example.com')
        ->to('customer@example.com')
        ->subject('Test')
        ->text('Body');

    (new ApplyBusinessNameToOutgoingMail)->handle(new MessageSending($email, []));

    expect($email->getFrom()[0]->getName())->toBe('TZ Holding Ltd');
});
