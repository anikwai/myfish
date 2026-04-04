<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

use function Pest\Laravel\deleteJson;
use function Pest\Laravel\postJson;

// Register

it('registers a new user and returns a token', function (): void {
    postJson('/api/v1/auth/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])
        ->assertCreated()
        ->assertJsonStructure(['token', 'user']);
});

it('returns a token using the provided device name on register', function (): void {
    postJson('/api/v1/auth/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'device_name' => 'iPhone 15',
    ])->assertCreated();

    $this->assertDatabaseHas('personal_access_tokens', ['name' => 'iPhone 15']);
});

it('defaults device name to mobile on register', function (): void {
    postJson('/api/v1/auth/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])->assertCreated();

    $this->assertDatabaseHas('personal_access_tokens', ['name' => 'mobile']);
});

it('returns validation errors when registering with invalid data', function (): void {
    postJson('/api/v1/auth/register', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('returns a validation error when email is already taken on register', function (): void {
    User::factory()->create(['email' => 'taken@example.com']);

    postJson('/api/v1/auth/register', [
        'name' => 'Jane',
        'email' => 'taken@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

// Login

it('logs in a user and returns a token', function (): void {
    $user = User::factory()->create(['password' => Hash::make('Password1!')]);

    postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'Password1!',
    ])
        ->assertOk()
        ->assertJsonStructure(['token', 'user']);
});

it('returns a two_factor challenge state when user has 2FA enabled', function (): void {
    $user = User::factory()->withTwoFactor()->create(['password' => Hash::make('Password1!')]);

    postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'Password1!',
    ])
        ->assertOk()
        ->assertJson(['two_factor' => true])
        ->assertJsonStructure(['two_factor', 'two_factor_token']);
});

it('returns a validation error when credentials are invalid on login', function (): void {
    User::factory()->create(['email' => 'test@example.com']);

    postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

// Two-Factor

it('completes 2FA login with a valid TOTP code', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    $twoFactorToken = Str::random(40);
    Cache::put("api.2fa_pending.{$twoFactorToken}", $user->id, now()->addMinutes(5));

    $code = app(Google2FA::class)->getCurrentOtp(decrypt($user->two_factor_secret));

    postJson('/api/v1/auth/two-factor', [
        'two_factor_token' => $twoFactorToken,
        'code' => $code,
    ])
        ->assertOk()
        ->assertJsonStructure(['token', 'user']);
});

it('completes 2FA login with a valid recovery code', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    $twoFactorToken = Str::random(40);
    Cache::put("api.2fa_pending.{$twoFactorToken}", $user->id, now()->addMinutes(5));

    postJson('/api/v1/auth/two-factor', [
        'two_factor_token' => $twoFactorToken,
        'recovery_code' => 'recovery-code-1',
    ])
        ->assertOk()
        ->assertJsonStructure(['token', 'user']);
});

it('returns an error for an invalid two_factor_token', function (): void {
    postJson('/api/v1/auth/two-factor', [
        'two_factor_token' => 'invalid-token',
        'code' => '123456',
    ])->assertUnprocessable()->assertJsonValidationErrors(['two_factor_token']);
});

it('returns an error for an expired two_factor_token', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    $twoFactorToken = Str::random(40);
    Cache::put("api.2fa_pending.{$twoFactorToken}", $user->id, now()->addMinutes(5));
    Cache::forget("api.2fa_pending.{$twoFactorToken}");

    postJson('/api/v1/auth/two-factor', [
        'two_factor_token' => $twoFactorToken,
        'code' => '123456',
    ])->assertUnprocessable()->assertJsonValidationErrors(['two_factor_token']);
});

// Logout

it('logs out the authenticated user and revokes the token', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('mobile')->plainTextToken;

    deleteJson('/api/v1/auth/logout', [], ['Authorization' => "Bearer {$token}"])
        ->assertOk()
        ->assertJson(['message' => 'Logged out successfully.']);

    $this->assertDatabaseCount('personal_access_tokens', 0);
});

it('returns 401 when logging out without a token', function (): void {
    deleteJson('/api/v1/auth/logout')->assertUnauthorized();
});

// Forgot Password

it('sends a password reset link', function (): void {
    Notification::fake();

    $user = User::factory()->create();

    postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonStructure(['message']);

    Notification::assertSentTo($user, ResetPassword::class);
});

it('returns a success response even for unregistered emails', function (): void {
    postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])
        ->assertOk()
        ->assertJsonStructure(['message']);
});

// Reset Password

it('resets the password with a valid token', function (): void {
    $user = User::factory()->create();
    $token = Password::createToken($user);

    postJson('/api/v1/auth/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'NewPassword1!',
        'password_confirmation' => 'NewPassword1!',
    ])->assertOk()->assertJsonStructure(['message']);

    expect(Hash::check('NewPassword1!', $user->fresh()->password))->toBeTrue();
});

it('returns a validation error for an invalid reset token', function (): void {
    $user = User::factory()->create();

    postJson('/api/v1/auth/reset-password', [
        'token' => 'bad-token',
        'email' => $user->email,
        'password' => 'NewPassword1!',
        'password_confirmation' => 'NewPassword1!',
    ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
});
