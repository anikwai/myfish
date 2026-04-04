<?php

use App\Models\Business;
use App\Models\User;
use App\Values\BusinessConfig;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileUnacceptableForCollection;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

test('business config defaults to TZ Holding Ltd', function (): void {
    $config = BusinessConfig::current();

    expect($config->name)->toBe('TZ Holding Ltd')
        ->and($config->address)->toBe('')
        ->and($config->phone)->toBe('')
        ->and($config->email)->toBe('');
});

test('business config can be saved and reloaded', function (): void {
    BusinessConfig::saveFromValidated([
        'business_name' => 'My Fish Co',
        'business_address' => '10 Beach Rd, Honiara',
        'business_phone' => '+677 12345',
        'business_email' => 'info@myfish.test',
    ]);

    $config = BusinessConfig::current();

    expect($config->name)->toBe('My Fish Co')
        ->and($config->address)->toBe('10 Beach Rd, Honiara')
        ->and($config->phone)->toBe('+677 12345')
        ->and($config->email)->toBe('info@myfish.test');
});

test('business name falls back to default when cleared', function (): void {
    BusinessConfig::saveFromValidated([
        'business_name' => '',
        'business_address' => '',
        'business_phone' => '',
        'business_email' => '',
    ]);

    expect(BusinessConfig::current()->name)->toBe('TZ Holding Ltd');
});

test('admin can update business settings via the settings page', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.business.update'), [
            'business_name' => 'New Name Ltd',
            'business_address' => 'Some Street',
            'business_phone' => '+677 99999',
            'business_email' => 'new@example.com',
        ])
        ->assertRedirect(route('admin.business.edit'));

    expect(BusinessConfig::current()->name)->toBe('New Name Ltd');
});

test('business name is required on settings update', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.business.update'), [
            'business_name' => '',
        ])
        ->assertSessionHasErrors(['business_name']);
});

test('non-admin cannot update business settings', function (): void {
    $client = User::factory()->client()->create();

    $this->actingAs($client)
        ->patch(route('admin.business.update'), [
            'business_name' => 'Hacker',
        ])
        ->assertForbidden();
});

test('admin can upload a business logo', function (): void {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->image('logo.png', 200, 200);

    $this->actingAs($admin)
        ->post(route('admin.business.logo.store'), ['logo' => $file])
        ->assertRedirect(route('admin.business.edit'));

    expect(Business::instance()->getFirstMedia('logo'))->not->toBeNull();
});

test('admin can remove the business logo', function (): void {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->image('logo.png', 200, 200);
    Business::instance()->addMedia($file)->toMediaCollection('logo');

    $this->actingAs($admin)
        ->delete(route('admin.business.logo.destroy'))
        ->assertRedirect(route('admin.business.edit'));

    expect(Business::instance()->getFirstMedia('logo'))->toBeNull();
});

test('logo upload requires an image file', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.business.logo.store'), ['logo' => 'not-a-file'])
        ->assertSessionHasErrors(['logo']);
});

test('logo url is included in business config', function (): void {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('logo.png', 200, 200);
    Business::instance()->addMedia($file)->toMediaCollection('logo');

    expect(BusinessConfig::current()->logo_url)->not->toBeNull();
});

test('business logo data uri embeds file bytes for remote pdf rendering', function (): void {
    Storage::fake('media');

    $file = UploadedFile::fake()->image('logo.png', 80, 80);
    Business::instance()->addMedia($file)->toMediaCollection('logo');

    $dataUri = Business::instance()->logoDataUriForPdf();

    expect($dataUri)->toBeString()
        ->toStartWith('data:image/png;base64,');
    $raw = base64_decode(substr((string) $dataUri, (int) strpos((string) $dataUri, ',') + 1), true);
    expect($raw)->not->toBeFalse()
        ->and(strlen($raw))->toBeGreaterThan(100);
});

test('admin can upload an SVG business logo', function (): void {
    Storage::fake('media');

    $admin = User::factory()->admin()->create();
    $svg = '<?xml version="1.0" encoding="UTF-8"?>'
        .'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
        .'<circle cx="10" cy="10" r="8" fill="blue"/></svg>';
    $file = UploadedFile::fake()->createWithContent('logo.svg', $svg);

    $this->actingAs($admin)
        ->post(route('admin.business.logo.store'), ['logo' => $file])
        ->assertRedirect(route('admin.business.edit'));

    $media = Business::instance()->getFirstMedia('logo');
    expect($media)->not->toBeNull()
        ->and(strtolower((string) $media->mime_type))->toContain('svg');
});

test('business logo data uri uses svg mime for svg uploads', function (): void {
    Storage::fake('media');

    $svg = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
    $file = UploadedFile::fake()->createWithContent('logo.svg', $svg);
    Business::instance()->addMedia($file)->toMediaCollection('logo');

    expect(Business::instance()->logoDataUriForPdf())->toStartWith('data:image/svg+xml;base64,');
});

test('logo upload rejects disallowed mime types', function (): void {
    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $this->actingAs($admin)
        ->post(route('admin.business.logo.store'), ['logo' => $file])
        ->assertSessionHasErrors(['logo']);
});

test('business logo media collection rejects disallowed mime types', function (): void {
    Storage::fake('media');

    $pdf = UploadedFile::fake()->create('document.pdf', 50, 'application/pdf');

    expect(fn () => Business::instance()->addMedia($pdf)->toMediaCollection('logo'))
        ->toThrow(FileUnacceptableForCollection::class);
});
