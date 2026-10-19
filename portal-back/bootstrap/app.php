<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

/**
 * Inicialização da Aplicação Laravel (Bootstrap)
 *
 * Papel Didático:
 * Configura os arquivos de rotas (web, api, console), os middlewares globais e o
 * tratamento padronizado de exceções para garantir que toda chamada em `/api/*`
 * receba respostas estritamente em JSON (sem redirecionamentos HTML).
 */
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Confia nos cabeçalhos X-Forwarded-* do proxy reverso em nuvem (ex: Railway)
        // para identificar corretamente o protocolo HTTPS e o IP real do cliente no rate limit.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        // Evita redirecionar chamadas de API não autenticadas para uma rota HTML 'login',
        // fazendo o Sanctum responder corretamente com HTTP 401 Unauthorized em JSON.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Garante que qualquer erro ou exceção disparado nas rotas /api/* seja serializado em JSON.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
