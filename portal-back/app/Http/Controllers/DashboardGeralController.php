<?php

namespace App\Http\Controllers;

use App\Http\Resources\DashboardGeralResource;
use App\Services\EspecialistaDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * DashboardGeralController
 *
 * Papel Didático:
 * Gerencia a entrega dos indicadores analíticos da visão principal (/dashboard/geral).
 * Atende ao Especialista (visão institucional global) e ao Professor (visão das turmas sob sua regência),
 * garantindo blindagem de acesso e formatação padronizada via DashboardGeralResource.
 */
class DashboardGeralController extends Controller
{
    /**
     * Injeção de dependência do serviço de inteligência acadêmica.
     */
    public function __construct(
        protected EspecialistaDashboardService $dashboardService
    ) {}

    /**
     * GET /api/dashboard/geral
     *
     * Retorna os KPIs consolidados, o resumo de médias/frequências por turma
     * e o feed de atualizações recentes adaptado ao papel autenticado.
     */
    public function geral(Request $request): JsonResponse
    {
        $user = $request->user();

        // Bloqueia acesso de usuários que não sejam do corpo docente ou pedagógico (ex: alunos comuns)
        if (! $user || (! $user->canManageAcademic() && ! $user->isProfessor())) {
            abort(403, 'Acesso restrito ao corpo docente e pedagógico.');
        }

        $divisao = $request->query('divisao');
        $dados = $this->dashboardService->obterVisaoGeral($user, $divisao);

        return (new DashboardGeralResource($dados))->response()->setStatusCode(200);
    }

    /**
     * GET /api/dashboard/notificacoes
     *
     * Endpoint sob demanda para carregar e filtrar o feed de atualizações (5, 25 ou 50 itens),
     * permitindo filtrar por quem enviou, por usuário que recebeu e por categoria.
     */
    public function notificacoes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || (! $user->canManageAcademic() && ! $user->isProfessor())) {
            abort(403, 'Acesso restrito ao corpo docente e pedagógico.');
        }

        $limite = (int) $request->query('limite', 5);
        if (! in_array($limite, [5, 25, 50], true)) {
            $limite = 5;
        }

        $filtros = [
            'destinatario' => $request->query('destinatario'),
            'remetente' => $request->query('remetente'),
            'categoria' => $request->query('categoria'),
        ];

        $notificacoes = $this->dashboardService->obterNotificacoesPaginadas($user, $limite, $filtros);

        return response()->json([
            'data' => $notificacoes,
            'total' => count($notificacoes),
            'limite' => $limite,
            'filtros' => $filtros,
        ], 200);
    }
}
