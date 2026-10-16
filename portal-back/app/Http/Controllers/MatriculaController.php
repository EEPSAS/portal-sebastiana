<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatriculaRequest;
use App\Http\Resources\MatriculaResource;
use App\Http\Resources\TurmaResource;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo vínculo de matrículas e movimentação de alunos em turmas.
 */
class MatriculaController extends Controller
{
    /**
     * Lista todas as matrículas ativas da escola.
     * Alimenta a relação nominal de estudantes e os contadores de turmas no painel acadêmico.
     *
     * @return JsonResponse Coleção de matrículas formatadas via MatriculaResource
     */
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Turma::class);

        $matriculas = Matricula::query()
            ->where('status_matricula', 'Ativo')
            ->with(['turma', 'aluno:id,name,email'])
            ->orderBy('id_matricula', 'desc')
            ->get();

        return response()->json(MatriculaResource::collection($matriculas), 200);
    }

    /**
     * Realiza a matrícula de um aluno em uma turma escolar.
     *
     * @param  StoreMatriculaRequest  $request  Form Request validada
     * @return JsonResponse Matrícula criada formatada por MatriculaResource
     */
    public function matricularAluno(StoreMatriculaRequest $request): JsonResponse
    {
        Gate::authorize('create', Turma::class);

        $turma = Turma::findOrFail($request->integer('turma_id'));

        // Valida se a capacidade física da turma foi atingida
        if ($turma->matriculas()->where('status_matricula', 'Ativo')->count() >= $turma->capacidade_maxima) {
            return response()->json([
                'message' => 'A turma já atingiu a capacidade máxima de alunos.',
            ], 422);
        }

        // Impede duplicação se o aluno já estiver com matrícula ativa, ou reativa se estiver inativo
        $matriculaExistente = Matricula::where('turma_id', $turma->id_turma)
            ->where('usuario_id', $request->integer('usuario_id'))
            ->first();

        if ($matriculaExistente) {
            if ($matriculaExistente->status_matricula === 'Ativo') {
                return response()->json([
                    'message' => 'O aluno já está matriculado nesta turma.',
                ], 422);
            }

            // Reativa o vínculo acadêmico existente
            $matriculaExistente->update([
                'status_matricula' => 'Ativo',
                'data_matricula' => $request->filled('data_matricula') ? $request->string('data_matricula')->toString() : now()->format('Y-m-d'),
            ]);

            $matriculaExistente->load(['turma', 'aluno:id,name,email']);

            return response()->json(new MatriculaResource($matriculaExistente), 200);
        }

        $matricula = Matricula::create([
            'turma_id' => $turma->id_turma,
            'usuario_id' => $request->integer('usuario_id'),
            'data_matricula' => $request->filled('data_matricula') ? $request->string('data_matricula')->toString() : now()->format('Y-m-d'),
            'status_matricula' => $request->filled('status_matricula') ? $request->string('status_matricula')->toString() : 'Ativo',
        ]);

        $matricula->load(['turma', 'aluno:id,name,email']);

        return response()->json(new MatriculaResource($matricula), 201);
    }

    /**
     * Transfere a matrícula do aluno para uma nova turma.
     */
    public function transferirTurma(Request $request, Matricula $matricula): JsonResponse
    {
        Gate::authorize('update', $matricula->turma);

        $validated = $request->validate([
            'nova_turma_id' => ['required', 'exists:turmas,id_turma', 'different:turma_id'],
        ]);

        $novaTurma = Turma::findOrFail($validated['nova_turma_id']);

        if ($novaTurma->matriculas()->where('status_matricula', 'Ativo')->count() >= $novaTurma->capacidade_maxima) {
            return response()->json([
                'message' => 'A nova turma já atingiu a capacidade máxima de alunos.',
            ], 422);
        }

        $matricula->update([
            'status_matricula' => 'Transferido',
        ]);

        $novaMatricula = Matricula::create([
            'turma_id' => $novaTurma->id_turma,
            'usuario_id' => $matricula->usuario_id,
            'data_matricula' => now()->format('Y-m-d'),
            'status_matricula' => 'Ativo',
        ]);

        return response()->json([
            'matricula_anterior' => new MatriculaResource($matricula),
            'nova_matricula' => new MatriculaResource($novaMatricula->load(['turma', 'aluno:id,name,email'])),
        ], 200);
    }

    /**
     * Cancela a matrícula ativa de um aluno.
     */
    public function cancelarMatricula(Request $request, Matricula $matricula): JsonResponse
    {
        Gate::authorize('update', $matricula->turma);

        $validated = $request->validate([
            'status_matricula' => ['nullable', 'string', 'in:Transferido,Evadido'],
        ]);

        $matricula->update([
            'status_matricula' => $validated['status_matricula'] ?? 'Evadido',
        ]);

        return response()->json(new MatriculaResource($matricula), 200);
    }

    /**
     * Consulta as turmas em que o aluno especificado possui matrícula.
     */
    public function listarTurmasDoAluno(User $usuario): JsonResponse
    {
        Gate::authorize('viewAny', Turma::class);

        $turmas = $usuario->turmas()->orderByDesc('ano_letivo')->get();

        return response()->json(TurmaResource::collection($turmas), 200);
    }

    /**
     * Retorna a lista de turmas em que o aluno autenticado está matriculado.
     */
    public function minhasTurmas(Request $request): JsonResponse
    {
        $turmas = $request->user()->turmas()->orderByDesc('ano_letivo')->get();

        return response()->json(TurmaResource::collection($turmas), 200);
    }
}
