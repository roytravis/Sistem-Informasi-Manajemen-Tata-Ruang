<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Enum;
use App\Models\User;
use App\Enums\UserRole; // <-- Tambahkan baris ini

class AuthController extends Controller
{
    // Fungsi untuk registrasi pengguna baru
    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'nullable|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', 'string', new Enum(UserRole::class)], // <-- Disederhanakan
            'unit_kerja' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'nama' => $validatedData['nama'],
            'nip' => $validatedData['nip'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => $validatedData['role'],
            'unit_kerja' => $validatedData['unit_kerja'],
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    // Fungsi untuk login pengguna
    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('nip', 'password'))) {
            return response()->json(['message' => 'NIP atau Password salah'], 401);
        }

        $user = User::where('nip', $request['nip'])->firstOrFail();
        $user->last_login = now(); // Update waktu login terakhir
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    // Fungsi untuk mendapatkan data pengguna yang sedang login
    public function user(Request $request)
    {
        return $request->user();
    }

    // Fungsi untuk logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}