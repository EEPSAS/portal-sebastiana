<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\NoticiaController;
use App\Http\Controllers\RadioatividadeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rota nomeada 'login' para responder a redirecionamentos de autenticação
Route::get('/login', function () {
    return response()->json([
        'message' => 'Não autenticado. Por favor, realize o login via POST em /api/auth/login ou /api/login com seu email e senha.',
    ], 401);
})->name('login');

// Endpoints diretos de autenticação
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/register', [AuthController::class, 'register'])->name('api.register');

// Endpoints sob o prefixo /auth
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');

    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('noticias', NoticiaController::class);
    Route::apiResource('radioatividades', RadioatividadeController::class);

    Route::get('/eventos/datas-importantes', [EventoController::class, 'datasImportantes']);
    Route::apiResource('eventos', EventoController::class);
});
