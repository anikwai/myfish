<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

test('redirect sends user to google', function () {
    Socialite::fake('google');

    $this->get(route('auth.google.redirect'))
        ->assertRedirect();
});

test('callback creates a new user', function () {
    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-abc',
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'avatar' => null,
    ]));

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'jane@example.com',
        'google_id' => 'google-abc',
    ]);
});

test('callback links google to existing user matched by email', function () {
    $user = User::factory()->create(['email' => 'jane@example.com', 'google_id' => null]);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-abc',
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => null,
    ]));

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticated();
    expect($user->fresh()->google_id)->toBe('google-abc');
});

test('callback logs in existing user matched by google id', function () {
    $user = User::factory()->create(['google_id' => 'google-xyz']);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-xyz',
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => null,
    ]));

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('connect links google id to authenticated user', function () {
    Socialite::fake('google');

    $user = User::factory()->create(['google_id' => null]);

    $this->actingAs($user)
        ->get(route('auth.google.connect'))
        ->assertRedirect();
});

test('connect callback saves google id on authenticated user', function () {
    $user = User::factory()->create(['google_id' => null]);

    Socialite::fake('google', (new SocialiteUser)->map([
        'id' => 'google-new',
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => null,
    ]));

    $this->actingAs($user)
        ->get(route('auth.google.connect.callback'))
        ->assertRedirect(route('security.edit'));

    expect($user->fresh()->google_id)->toBe('google-new');
});

test('disconnect removes google id', function () {
    $user = User::factory()->create(['google_id' => 'google-abc']);

    $this->actingAs($user)
        ->delete(route('auth.google.disconnect'))
        ->assertRedirect();

    expect($user->fresh()->google_id)->toBeNull();
});

test('disconnect is blocked when user has no password', function () {
    $user = User::factory()->create(['google_id' => 'google-abc', 'password' => null]);

    $this->actingAs($user)
        ->delete(route('auth.google.disconnect'))
        ->assertSessionHasErrors('google');

    expect($user->fresh()->google_id)->toBe('google-abc');
});
