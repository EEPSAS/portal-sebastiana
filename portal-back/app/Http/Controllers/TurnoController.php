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
    public function show(Turno|string $turno): TurnoResource
    {
        $model = $this->resolverTurno($turno);

        return new TurnoResource($model);
    }

    /**
     * PUT /api/turnos/{turno}
     * Atualiza os parâmetros operacionais (horários, duração de aula, intervalo).
     */
    public function update(UpdateTurnoRequest $request, Turno|string $turno): TurnoResource
    {
        $model = $this->resolverTurno($turno);
        $dados = $request->validated();

        $model->fill($dados);

        // Se uma grade customizada não foi fornecida explicitamente, regenera a grade automática
        if (! isset($dados['grade_horarios'])) {
            $model->grade_horarios = $model->gerarGradeAutomatica();
        }

        $model->save();

        return new TurnoResource($model);
    }

    /**
     * PATCH /api/turnos/{turno}/toggle
     * Alterna o estado de ativação operacional do turno.
     */
    public function toggle(Request $request, Turno|string $turno): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem ativar ou desativar turnos.');
        }

        $model = $this->resolverTurno($turno);
        $model->ativo = ! $model->ativo;
        $model->save();

        return response()->json([
            'status' => 'sucesso',
            'message' => "Turno {$model->nome} ".($model->ativo ? 'ativado' : 'desativado').' com sucesso.',
            'dados' => new TurnoResource($model),
        ], 200);
    }

    /**
     * Garante a resolução do Turno mesmo se o binding de rota falhar ou receber string direta.
     */
    private function resolverTurno(Turno|string $turno): Turno
    {
        if ($turno instanceof Turno) {
            return $turno;
        }

        $encontrado = Turno::where('id', $turno)
            ->orWhereRaw('LOWER(id) = ?', [strtolower((string) $turno)])
            ->first();

        if (! $encontrado) {
            abort(404, "Turno '{$turno}' não encontrado no sistema escolar.");
        }

        return $encontrado;
    }
}
