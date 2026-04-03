<?php

use App\Models\User;
use App\Values\BusinessConfig;
use Database\Seeders\RoleSeeder;

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
