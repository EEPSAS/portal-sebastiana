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

        $dados = $this->dashboardService->obterVisaoGeral($user);

        return (new DashboardGeralResource($dados))->response()->setStatusCode(200);
    }
}
