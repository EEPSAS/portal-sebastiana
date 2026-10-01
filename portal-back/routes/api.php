<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmprestimoController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\LivroController;
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

// Notícias e acervo de livros são conteúdos públicos para consulta
Route::get('/noticias', [NoticiaController::class, 'index']);
Route::get('/noticias/{noticia}', [NoticiaController::class, 'show']);

Route::get('/livros', [LivroController::class, 'index']);
Route::get('/livros/{livro}', [LivroController::class, 'show']);
Route::get('/livros/{livro}/disponibilidade', [LivroController::class, 'verificarDisponibilidade']);

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

    Route::apiResource('noticias', NoticiaController::class)->except(['index', 'show']);
    Route::apiResource('radioatividades', RadioatividadeController::class);

    Route::get('/eventos/datas-importantes', [EventoController::class, 'datasImportantes']);
    Route::apiResource('eventos', EventoController::class);

    // Gestão de Livros (Criação, Edição, Deleção)
    Route::post('/livros', [LivroController::class, 'store']);
    Route::put('/livros/{livro}', [LivroController::class, 'update']);
    Route::patch('/livros/{livro}', [LivroController::class, 'update']);
    Route::delete('/livros/{livro}', [LivroController::class, 'destroy']);

    // Empréstimos de Livros
    Route::get('/emprestimos/meus-emprestimos', [EmprestimoController::class, 'meusEmprestimos']);
    Route::post('/emprestimos/solicitar', [EmprestimoController::class, 'solicitar']);
    Route::patch('/emprestimos/{emprestimo}/aprovar', [EmprestimoController::class, 'aprovar']);
    Route::patch('/emprestimos/{emprestimo}/renovar', [EmprestimoController::class, 'renovar']);
    Route::patch('/emprestimos/{emprestimo}/devolver', [EmprestimoController::class, 'registrarDevolucao']);
    Route::patch('/emprestimos/{emprestimo}/status', [EmprestimoController::class, 'atualizarStatus']);
    Route::apiResource('emprestimos', EmprestimoController::class)->only(['index', 'show']);
});
