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
