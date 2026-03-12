<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm()
    {
        // If already logged in, redirect to dashboard
        if (Auth::check()) {
            return redirect()->route('penilaian');
        }

        return view('auth.login');
    }

    /**
     * Handle login request (session-based auth for web).
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'nip' => 'required|string',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            // Update last_login timestamp
            $user = Auth::user();
            $user->last_login = now();
            $user->save();

            return redirect()->intended(route('penilaian'));
        }

        return back()->withErrors([
            'nip' => 'NIP atau Password salah.',
        ])->onlyInput('nip');
    }

    /**
     * Handle logout request.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
