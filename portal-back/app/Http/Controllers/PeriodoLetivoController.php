<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePeriodoLetivoRequest;
use App\Http\Requests\UpdatePeriodoLetivoRequest;
use App\Http\Resources\PeriodoLetivoResource;
use App\Models\PeriodoLetivo;
use App\Services\PeriodoLetivoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * PeriodoLetivoController
 *
 * Papel Didático:
 * Controlador RESTful responsável pelos endpoints de gestão e consulta dos
 * Períodos Letivos, suas divisões (Bimestres/Trimestres) e sincronização com a Agenda.
 */
class PeriodoLetivoController extends Controller
{
    public function __construct(
        protected PeriodoLetivoService $service
    ) {}

    /**
     * GET /api/periodos-letivos
     *
     * Lista todos os períodos letivos cadastrados com suas divisões.
     */
    public function index(): AnonymousResourceCollection
    {
        $periodos = $this->service->listar();

        return PeriodoLetivoResource::collection($periodos);
    }

    /**
     * GET /api/periodos-letivos/ativo
     *
     * Retorna o período letivo atualmente vigente/ativo.
     */
    public function ativo(): JsonResponse|PeriodoLetivoResource
    {
        $periodoAtivo = $this->service->obterAtivo();

        if (! $periodoAtivo) {
            return response()->json([
                'message' => 'Nenhum período letivo ativo configurado no momento.',
            ], 404);
        }

        return new PeriodoLetivoResource($periodoAtivo);
    }

    /**
     * GET /api/periodos-letivos/{periodo}
     *
     * Detalhes de um período letivo específico.
     */
    public function show(PeriodoLetivo $periodo): PeriodoLetivoResource
    {
        return new PeriodoLetivoResource($periodo->load(['divisoes', 'turmas']));
    }

    /**
     * POST /api/periodos-letivos
     *
     * Cria um novo período letivo completo (exclusivo Especialista/Adm).
     */
    public function store(StorePeriodoLetivoRequest $request): JsonResponse
    {
        $novoPeriodo = $this->service->criar($request->validated(), $request->user());

        return (new PeriodoLetivoResource($novoPeriodo))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/periodos-letivos/{periodo}
     *
     * Atualiza um período letivo existente (exclusivo Especialista/Adm).
     */
    public function update(UpdatePeriodoLetivoRequest $request, PeriodoLetivo $periodo): PeriodoLetivoResource
    {
        $atualizado = $this->service->atualizar($periodo, $request->validated(), $request->user());

        return new PeriodoLetivoResource($atualizado);
    }

    /**
     * PATCH /api/periodos-letivos/{periodo}/ativar
     *
     * Define o período letivo indicado como vigente/ativo.
     */
    public function ativar(Request $request, PeriodoLetivo $periodo): PeriodoLetivoResource
    {
        if (! $request->user()?->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem alterar o período letivo ativo.');
        }

        $ativado = $this->service->ativar($periodo);

        return new PeriodoLetivoResource($ativado);
    }

    /**
     * DELETE /api/periodos-letivos/{periodo}
     *
     * Exclui o período letivo caso não possua turmas associadas.
     */
    public function destroy(Request $request, PeriodoLetivo $periodo): JsonResponse
    {
        if (! $request->user()?->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem excluir períodos letivos.');
        }

        $this->service->excluir($periodo);

        return response()->json([
            'message' => "Período Letivo de {$periodo->ano} excluído com sucesso.",
        ], 200);
    }

    /**
     * POST /api/periodos-letivos/{periodo}/sincronizar-agenda
     *
     * Força a criação/atualização dos marcos escolares no calendário institucional.
     */
    public function sincronizarAgenda(Request $request, PeriodoLetivo $periodo): JsonResponse
    {
        if (! $request->user()?->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem sincronizar os marcos na agenda.');
        }

        $total = $this->service->sincronizarMarcosAgenda($periodo, $request->user());

        return response()->json([
            'message' => "{$total} marcos do ano letivo de {$periodo->ano} foram sincronizados com o calendário institucional.",
            'marcos_sincronizados' => $total,
        ], 200);
    }
}
