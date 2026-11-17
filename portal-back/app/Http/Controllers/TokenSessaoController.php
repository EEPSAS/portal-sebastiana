<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexTokenSessaoRequest;
use App\Http\Resources\TokenSessaoResource;
use App\Models\User;
use App\Services\TokenSessaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Controller responsável pelo gerenciamento administrativo dos tokens Sanctum:
 * listagem de sessões (sem exibir o segredo do token), revogação manual e limpeza de expirados.
 */
class TokenSessaoController extends Controller
{
    public function __construct(
        protected TokenSessaoService $tokenSessaoService
    ) {}

    /**
     * GET /api/tokens
     * Lista os tokens registrados na tabela personal_access_tokens com metadados de origem e validade.
     */
    public function index(IndexTokenSessaoRequest $request): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Obtém a página de tokens filtrada e os contadores globais (ativos vs expirados)
        $tokensPaginados = $this->tokenSessaoService->listarTokens($request->validated());
        $resumo = $this->tokenSessaoService->obterResumoContadores();

        $payload = TokenSessaoResource::collection($tokensPaginados)
            ->additional(['resumo' => $resumo])
            ->response($request)
            ->getData(true);

        return response()->json($payload, 200);
    }

    /**
     * DELETE /api/tokens/{token}
     * Revoga (exclui manualmente) um token específico pelo seu ID.
     */
    public function destroy(PersonalAccessToken $token): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Remove fisicamente o token do banco, encerrando a sessão correspondente imediatamente
        $this->tokenSessaoService->revogarToken($token);

        return response()->json([
            'message' => 'Token revogado e removido com sucesso.',
        ], 200);
    }

    /**
     * DELETE /api/usuarios/{usuario}/tokens
     * Revoga todos os tokens vinculados a um usuário específico.
     */
    public function revogarDoUsuario(Request $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Caso o administrador esteja revogando os próprios tokens em lote, preserva a sessão atual
        $usuarioLogado = $request->user();
        $tokenAtual = $usuarioLogado?->currentAccessToken();
        $excetoTokenId = ($usuarioLogado !== null && $tokenAtual instanceof PersonalAccessToken && (int) $usuarioLogado->id === (int) $usuario->id)
            ? (int) $tokenAtual->id
            : null;

        $removidos = $this->tokenSessaoService->revogarTokensDoUsuario($usuario, $excetoTokenId);

        return response()->json([
            'message' => "Foram revogados {$removidos} token(s) do usuário {$usuario->name}.",
            'removidos' => $removidos,
        ], 200);
    }

    /**
     * DELETE /api/tokens/expirados
     * Aciona manualmente a faxina imediata de todos os tokens já vencidos (> 6 horas).
     */
    public function limparExpirados(): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Deleta todos os tokens cujo prazo de 6 horas já expirou
        $removidos = $this->tokenSessaoService->limparTokensExpirados();

        return response()->json([
            'message' => $removidos > 0
                ? "Limpeza concluída: {$removidos} token(s) vencido(s) removido(s)."
                : 'Nenhum token vencido encontrado para limpeza.',
            'removidos' => $removidos,
        ], 200);
    }
}
