<?php

namespace App\Http\Controllers;

use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * DashboardAdminController
 *
 * Papel Didático:
 * Entrega os indicadores de gestão do sistema (usuários, pendências, saúde da configuração)
 * consumidos pelo Geral do Administrador (/dashboard/geral). Acesso restrito a quem gerencia usuários.
 */
class DashboardAdminController extends Controller
{
    public function __construct(
        protected AdminDashboardService $adminDashboardService
    ) {}

    /**
     * GET /api/dashboard/admin
     */
    public function geral(Request $request): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        return response()->json($this->adminDashboardService->obterVisaoAdmin());
    }
}
