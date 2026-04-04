<?php

test('branding svg assets exist in public', function (): void {
    foreach (['logo.svg', 'logo-dark.svg', 'favicon-icon.svg'] as $file) {
        expect(public_path("images/{$file}"))->toBeFile();
    }
});
