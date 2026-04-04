<?php

use App\Listeners\ApplyBusinessNameToOutgoingMail;
use App\Models\Order;
use App\Models\User;
use App\Notifications\InvoiceNotification;
use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Email;

test('notification mail html uses business branding instead of laravel default logo', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    $html = (string) (new InvoiceNotification($order))->toMail($user)->render();

    expect($html)->not->toContain('laravel.com/img/notification-logo')
        ->and($html)->toContain('TZ Holding Ltd');
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
