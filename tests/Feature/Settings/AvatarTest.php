<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('media');
});

test('user can upload an avatar', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

    $this->actingAs($user)
        ->post(route('avatar.store'), ['avatar' => $file])
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh()->getFirstMediaUrl('avatar', 'thumb'))->not->toBeEmpty();
});

test('avatar is replaced when a new one is uploaded', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('avatar.store'), ['avatar' => UploadedFile::fake()->image('first.jpg')]);

    $this->actingAs($user)
        ->post(route('avatar.store'), ['avatar' => UploadedFile::fake()->image('second.jpg')]);

    expect($user->fresh()->getMedia('avatar'))->toHaveCount(1);
});

test('avatar upload rejects invalid file type', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('avatar.store'), ['avatar' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')])
        ->assertSessionHasErrors('avatar');
});

test('avatar upload rejects files over 2mb', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('avatar.store'), ['avatar' => UploadedFile::fake()->image('big.jpg')->size(3000)])
        ->assertSessionHasErrors('avatar');
});

test('user can remove their avatar', function () {
    $user = User::factory()->create();
    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('avatar');

    $this->actingAs($user)
        ->delete(route('avatar.destroy'))
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh()->getMedia('avatar'))->toBeEmpty();
});

test('avatar url is included in inertia shared props', function () {
    $user = User::factory()->create();
    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('avatar');

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page
            ->has('auth.user.avatar')
        );
});

test('avatar url is null in shared props when no avatar is set', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.avatar', null)
        );
});
