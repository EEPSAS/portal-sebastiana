<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatriculaRequest;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pelo gerenciamento de matrículas e movimentação de alunos em turmas.
class MatriculaController extends Controller
{
    // Realiza a matrícula de um aluno em uma turma respeitando a capacidade máxima.
    public function matricularAluno(StoreMatriculaRequest $request): JsonResponse
    {
        Gate::authorize('create', Turma::class);

        $turma = Turma::findOrFail($request->integer('turma_id'));

        if ($turma->matriculas()->where('status_matricula', 'Ativo')->count() >= $turma->capacidade_maxima) {
            return response()->json([
                'message' => 'A turma já atingiu a capacidade máxima de alunos.',
            ], 422);
        }

        $jaMatriculado = Matricula::where('turma_id', $turma->id_turma)
            ->where('usuario_id', $request->integer('usuario_id'))
            ->exists();

        if ($jaMatriculado) {
            return response()->json([
                'message' => 'O aluno já está matriculado nesta turma.',
            ], 422);
        }

        $matricula = Matricula::create([
            'turma_id' => $turma->id_turma,
            'usuario_id' => $request->integer('usuario_id'),
            'data_matricula' => $request->filled('data_matricula') ? $request->string('data_matricula')->toString() : now()->format('Y-m-d'),
            'status_matricula' => $request->filled('status_matricula') ? $request->string('status_matricula')->toString() : 'Ativo',
        ]);

        return response()->json($matricula->load(['turma', 'aluno:id,name,email']), 201);
    }

    // Transfere a matrícula do aluno para uma nova turma.
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
            'matricula_anterior' => $matricula,
            'nova_matricula' => $novaMatricula->load(['turma', 'aluno:id,name,email']),
        ], 200);
    }

    // Cancela ou encerra a matrícula de um aluno (transferência ou evasão).
    public function cancelarMatricula(Request $request, Matricula $matricula): JsonResponse
    {
        Gate::authorize('update', $matricula->turma);

        $validated = $request->validate([
            'status_matricula' => ['nullable', 'string', 'in:Transferido,Evadido'],
        ]);

        $matricula->update([
            'status_matricula' => $validated['status_matricula'] ?? 'Evadido',
        ]);

        return response()->json($matricula, 200);
    }

    // Lista as turmas em que determinado aluno está matriculado.
    public function listarTurmasDoAluno(User $usuario): JsonResponse
    {
        Gate::authorize('viewAny', Turma::class);

        $turmas = $usuario->turmas()->orderByDesc('ano_letivo')->get();

        return response()->json($turmas, 200);
    }

    // Lista as turmas do próprio aluno autenticado.
    public function minhasTurmas(Request $request): JsonResponse
    {
        $turmas = $request->user()->turmas()->orderByDesc('ano_letivo')->get();

        return response()->json($turmas, 200);
    }
}
