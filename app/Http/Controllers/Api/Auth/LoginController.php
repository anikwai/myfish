<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function store(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->two_factor_confirmed_at !== null) {
            Auth::logout();

            $twoFactorToken = Str::random(40);
            Cache::put("api.2fa_pending.{$twoFactorToken}", $user->id, now()->addMinutes(5));

            return response()->json([
                'two_factor' => true,
                'two_factor_token' => $twoFactorToken,
            ]);
        }

        $token = $user->createToken($request->string('device_name', 'mobile')->toString())->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }
}
