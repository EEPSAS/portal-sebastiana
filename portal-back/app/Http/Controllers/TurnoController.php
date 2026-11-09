<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateTurnoRequest;
use App\Http\Resources\TurnoResource;
use App\Models\Turno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Controller TurnoController - Gestão de Turnos de Funcionamento e Módulos de Aula.
 */
class TurnoController extends Controller
{
    /**
     * GET /api/turnos
     * Lista todos os turnos escolares configurados na instituição.
     */
    public function index(): AnonymousResourceCollection
    {
        $turnos = Turno::orderBy('id')->get();

        return TurnoResource::collection($turnos);
    }

    /**
     * GET /api/turnos/{turno}
     * Detalhes de um turno específico e sua grade de horários.
     */
    public function show(Turno $turno): TurnoResource
    {
        return new TurnoResource($turno);
    }

    /**
     * PUT /api/turnos/{turno}
     * Atualiza os parâmetros operacionais (horários, duração de aula, intervalo).
     */
    public function update(UpdateTurnoRequest $request, Turno $turno): TurnoResource
    {
        $dados = $request->validated();

        $turno->fill($dados);

        // Se uma grade customizada não foi fornecida explicitamente, regenera a grade automática
        if (! isset($dados['grade_horarios'])) {
            $turno->grade_horarios = $turno->gerarGradeAutomatica();
        }

        $turno->save();

        return new TurnoResource($turno);
    }

    /**
     * PATCH /api/turnos/{turno}/toggle
     * Alterna o estado de ativação operacional do turno.
     */
    public function toggle(Request $request, Turno $turno): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem ativar ou desativar turnos.');
        }

        $turno->ativo = ! $turno->ativo;
        $turno->save();

        return response()->json([
            'status' => 'sucesso',
            'message' => "Turno {$turno->nome} ".($turno->ativo ? 'ativado' : 'desativado').' com sucesso.',
            'dados' => new TurnoResource($turno),
        ], 200);
    }
}
