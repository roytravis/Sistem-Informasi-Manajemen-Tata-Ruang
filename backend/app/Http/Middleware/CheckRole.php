<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Trim role to handle any whitespace in database
        $userRole = Auth::user() ? trim(Auth::user()->role) : null;

        if (!Auth::check() || !in_array($userRole, $roles)) {
            // API requests get JSON response
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Akses ditolak: Anda tidak memiliki izin.'], 403);
            }

            // Web requests get redirected with flash message
            return redirect()->route('penilaian')
                ->with('error', 'Akses ditolak: Anda tidak memiliki izin untuk halaman tersebut.');
        }
        return $next($request);
    }
}

