<?php

namespace App\Listeners;

use App\Values\BusinessConfig;
use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Address;

/**
 * Replaces the mail "from" display name with the configured business name so transactional
 * mail matches admin branding (independent of APP_NAME / MAIL_FROM_NAME defaults).
 */
final class ApplyBusinessNameToOutgoingMail
{
    public function handle(MessageSending $event): void
    {
        try {
            $businessName = BusinessConfig::current()->name;
        } catch (\Throwable) {
            return;
        }

        $from = $event->message->getFrom();
        if ($from === []) {
            return;
        }

        $first = $from[0];
        $event->message->from(new Address($first->getAddress(), $businessName));
    }
}
