<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\getJson;
use function Pest\Laravel\putJson;

beforeEach(function (): void {
    $this->seed(RoleSeeder::class);
});

// GET /api/v1/profile

it('returns the authenticated user profile', function (): void {
    $user = User::factory()->client()->create(['phone' => '+677 12345']);

    getJson('/api/v1/profile', [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertOk()
        ->assertJsonStructure(['data' => ['id', 'attributes' => ['name', 'email', 'phone']]]);
});

it('returns 401 for unauthenticated profile request', function (): void {
    getJson('/api/v1/profile')->assertUnauthorized();
});

// PUT /api/v1/profile

it('updates the authenticated user profile', function (): void {
    $user = User::factory()->client()->create();

    putJson('/api/v1/profile', [
        'name' => 'Updated Name',
        'email' => $user->email,
        'phone' => '+677 99999',
    ], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertOk()
        ->assertJsonPath('data.attributes.name', 'Updated Name');

    expect($user->fresh()->name)->toBe('Updated Name');
    expect($user->fresh()->phone)->toBe('+677 99999');
});

it('clears email verification when email changes', function (): void {
    $user = User::factory()->client()->create(['email_verified_at' => now()]);

    putJson('/api/v1/profile', [
        'name' => $user->name,
        'email' => 'new@example.com',
    ], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])->assertOk();

    expect($user->fresh()->email_verified_at)->toBeNull();
});

it('returns 422 when profile update has no name', function (): void {
    $user = User::factory()->client()->create();

    putJson('/api/v1/profile', ['email' => $user->email], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('returns 422 when email is already taken by another user', function (): void {
    $other = User::factory()->client()->create(['email' => 'taken@example.com']);
    $user = User::factory()->client()->create();

    putJson('/api/v1/profile', ['name' => $user->name, 'email' => 'taken@example.com'], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// PUT /api/v1/profile/password

it('updates the password with a valid current password', function (): void {
    $user = User::factory()->client()->create(['password' => Hash::make('OldPassword1!')]);

    putJson('/api/v1/profile/password', [
        'current_password' => 'OldPassword1!',
        'password' => 'NewPassword1!',
        'password_confirmation' => 'NewPassword1!',
    ], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertOk()
        ->assertJsonFragment(['message' => 'Password updated successfully.']);

    expect(Hash::check('NewPassword1!', $user->fresh()->password))->toBeTrue();
});

it('returns 422 when current password is wrong', function (): void {
    $user = User::factory()->client()->create(['password' => Hash::make('CorrectPassword1!')]);

    putJson('/api/v1/profile/password', [
        'current_password' => 'WrongPassword1!',
        'password' => 'NewPassword1!',
        'password_confirmation' => 'NewPassword1!',
    ], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);
});

it('returns 422 when password confirmation does not match', function (): void {
    $user = User::factory()->client()->create(['password' => Hash::make('OldPassword1!')]);

    putJson('/api/v1/profile/password', [
        'current_password' => 'OldPassword1!',
        'password' => 'NewPassword1!',
        'password_confirmation' => 'Mismatch1!',
    ], [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('returns 401 for unauthenticated password update', function (): void {
    putJson('/api/v1/profile/password', [])->assertUnauthorized();
});
