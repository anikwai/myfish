<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\TwoFactorRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

/** @group Authentication */
class TwoFactorController extends Controller
{
    public function __construct(private TwoFactorAuthenticationProvider $twoFactor) {}

    /** @unauthenticated */
    public function store(TwoFactorRequest $request): JsonResponse
    {
        $cacheKey = "api.2fa_pending.{$request->two_factor_token}";
        $userId = Cache::get($cacheKey);

        if (! $userId) {
            throw ValidationException::withMessages([
                'two_factor_token' => ['Invalid or expired two-factor token.'],
            ]);
        }

        /** @var User $user */
        $user = User::findOrFail($userId);

        $verified = false;

        if ($request->filled('code')) {
            $verified = $this->twoFactor->verify(
                decrypt($user->two_factor_secret),
                $request->string('code')->toString()
            );
        } elseif ($request->filled('recovery_code')) {
            $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);
            $recoveryCode = $request->string('recovery_code')->toString();

            if (in_array($recoveryCode, $recoveryCodes, true)) {
                $verified = true;
                $user->forceFill([
                    'two_factor_recovery_codes' => encrypt(json_encode(
                        array_values(array_filter($recoveryCodes, fn ($code) => $code !== $recoveryCode))
                    )),
                ])->save();
            }
        }

        if (! $verified) {
            throw ValidationException::withMessages([
                'code' => [__('auth.failed')],
            ]);
        }

        Cache::forget($cacheKey);

        $token = $user->createToken($request->string('device_name', 'mobile')->toString())->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }
}
