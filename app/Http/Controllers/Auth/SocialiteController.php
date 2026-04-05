<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\StoreSocialiteAvatar;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class SocialiteController extends Controller
{
    public function __construct(private readonly StoreSocialiteAvatar $storeSocialiteAvatar) {}

    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $user = User::firstWhere('google_id', $googleUser->getId())
            ?? User::firstWhere('email', $googleUser->getEmail());

        if ($user) {
            if (! $user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }
        } else {
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
            ]);
        }

        if ($googleUser->getAvatar()) {
            $this->storeSocialiteAvatar->handle($user, $googleUser->getAvatar());
        }

        Auth::login($user, remember: true);

        return to_route('dashboard');
    }

    public function connect(Request $request): SymfonyRedirectResponse
    {
        $request->session()->put('socialite_connect_user', $request->user()->id);

        return Socialite::driver('google')->redirect();
    }

    public function connectCallback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $request->user()->update(['google_id' => $googleUser->getId()]);

        if ($googleUser->getAvatar()) {
            $this->storeSocialiteAvatar->handle($request->user(), $googleUser->getAvatar());
        }

        return to_route('security.edit');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->password) {
            return back()->withErrors(['google' => 'Set a password before disconnecting Google to avoid losing access to your account.']);
        }

        $user->update(['google_id' => null]);

        return back();
    }
}
