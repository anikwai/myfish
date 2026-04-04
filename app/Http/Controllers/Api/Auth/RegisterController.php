<?php

namespace App\Http\Controllers\Api\Auth;

use App\Actions\Fortify\CreateNewUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    public function store(RegisterRequest $request, CreateNewUser $createNewUser): JsonResponse
    {
        $user = $createNewUser->create(array_merge(
            $request->validated(),
            ['password_confirmation' => $request->input('password_confirmation')]
        ));

        $token = $user->createToken($request->string('device_name', 'mobile')->toString())->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ], 201);
    }
}
