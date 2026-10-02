<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTurmaRequest;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TurmaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Turma::class);

        $query = Turma::query()->withCount(['alunos', 'disciplinas']);

        if ($request->filled('ano_letivo')) {
            $query->where('ano_letivo', $request->integer('ano_letivo'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('turno')) {
            $query->where('turno', $request->string('turno')->toString());
        }

        return response()->json($query->orderBy('nome_identificador')->get(), 200);
    }

    public function store(StoreTurmaRequest $request): JsonResponse
    {
        Gate::authorize('create', Turma::class);

        $turma = Turma::create($request->validated());

        return response()->json($turma, 201);
    }

    public function show(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $turma->loadCount(['alunos', 'disciplinas']);

        return response()->json($turma, 200);
    }

    public function update(Request $request, Turma $turma): JsonResponse
    {
        Gate::authorize('update', $turma);

        $validated = $request->validate([
            'nome_identificador' => ['sometimes', 'required', 'string', 'max:255'],
            'turno' => ['sometimes', 'required', 'string', 'max:50'],
            'ano_letivo' => ['sometimes', 'required', 'integer', 'min:2000', 'max:2100'],
            'capacidade_maxima' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status' => ['nullable', 'string', 'in:Ativa,Concluída'],
        ]);

        $turma->update($validated);

        return response()->json($turma, 200);
    }

    public function destroy(Turma $turma): JsonResponse
    {
        Gate::authorize('delete', $turma);

        $turma->delete();

        return response()->json(null, 204);
    }

    public function alunos(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $alunos = $turma->alunos()->orderBy('name')->get();

        return response()->json($alunos, 200);
    }

    public function disciplinas(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $disciplinas = $turma->turmaDisciplinas()
            ->with(['disciplina', 'professor:id,name,email'])
            ->get();

        return response()->json($disciplinas, 200);
    }

    public function vincularDisciplina(Request $request, Turma $turma): JsonResponse
    {
        Gate::authorize('update', $turma);

        $validated = $request->validate([
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'professor_id' => ['nullable', 'exists:users,id'],
        ]);

        $vinculo = TurmaDisciplina::updateOrCreate(
            [
                'turma_id' => $turma->id_turma,
                'disciplina_id' => $validated['disciplina_id'],
            ],
            [
                'professor_id' => $validated['professor_id'] ?? null,
            ]
        );

        return response()->json($vinculo->load(['disciplina', 'professor:id,name,email']), 200);
    }

    public function desvincularDisciplina(Turma $turma, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $turma);

        TurmaDisciplina::where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplina->id_disciplina)
            ->delete();

        return response()->json(null, 204);
    }
}
