<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateHorarioRequest;
use App\Http\Requests\MoveHorarioAulaRequest;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\TurmaHorarioResource;
use App\Models\Horario;
use App\Models\HorarioAula;
use App\Models\Turma;
use App\Services\HorarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HorarioController extends Controller
{
    public function index(Request $request, HorarioService $horarioService): AnonymousResourceCollection
    {
        return TurmaHorarioResource::collection($horarioService->turmasVisiveis($request->user()));
    }

    public function gerar(GenerateHorarioRequest $request, Turma $turma, HorarioService $horarioService): JsonResponse
    {
        if ($turma->status !== 'Ativa') {
            abort(422, 'Só é possível gerar horários para turmas ativas.');
        }

        return (new HorarioResource($horarioService->gerar($turma)))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/horarios/gerar-turno
     * Gera simultaneamente a grade de todas as turmas ativas de um turno específico.
     */
    public function gerarPorTurno(Request $request, HorarioService $horarioService): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem gerar horários escolares.');
        }

        $request->validate([
            'turno' => ['required', 'string'],
            'ano_letivo' => ['nullable', 'integer', 'min:2020', 'max:2050'],
        ]);

        $turno = (string) $request->input('turno');
        $anoLetivo = (int) ($request->input('ano_letivo') ?: date('Y'));

        $horarios = $horarioService->gerarPorTurno($turno, $anoLetivo);

        return response()->json([
            'status' => 'sucesso',
            'message' => "Horários do turno {$turno} gerados com sucesso ({$horarios->count()} turmas).",
            'dados' => TurmaHorarioResource::collection($horarioService->turmasVisiveis($user)),
        ], 201);
    }

    /**
     * POST /api/horarios/gerar-todas
     * Gera simultaneamente os horários de todas as turmas ativas da instituição no ano letivo.
     */
    public function gerarTodas(Request $request, HorarioService $horarioService): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->canManageAcademic()) {
            abort(403, 'Apenas Especialistas e Administradores podem gerar horários escolares.');
        }

        $request->validate([
            'ano_letivo' => ['nullable', 'integer', 'min:2020', 'max:2050'],
        ]);

        $anoLetivo = (int) ($request->input('ano_letivo') ?: date('Y'));

        $horarios = $horarioService->gerarTodas($anoLetivo);

        return response()->json([
            'status' => 'sucesso',
            'message' => "Horários de todas as turmas gerados com sucesso ({$horarios->count()} turmas).",
            'dados' => TurmaHorarioResource::collection($horarioService->turmasVisiveis($user)),
        ], 201);
    }

    public function moverAula(
        MoveHorarioAulaRequest $request,
        Horario $horario,
        HorarioAula $aula,
        HorarioService $horarioService
    ): JsonResponse {
        abort_unless($aula->horario_id === $horario->id, 404);

        $horarioAtualizado = $horarioService->mover($horario, $aula, $request->validated());

        return (new HorarioResource($horarioAtualizado))->response();
    }
}
