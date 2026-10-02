<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisciplinaRequest;
use App\Models\Disciplina;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DisciplinaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Disciplina::class);

        $query = Disciplina::query();

        if ($request->filled('q')) {
            $query->where('nome', 'like', '%'.$request->string('q')->toString().'%');
        }

        return response()->json($query->orderBy('nome')->get(), 200);
    }

    public function store(StoreDisciplinaRequest $request): JsonResponse
    {
        Gate::authorize('create', Disciplina::class);

        $disciplina = Disciplina::create($request->validated());

        return response()->json($disciplina, 201);
    }

    public function show(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('view', $disciplina);

        $disciplina->load(['turmas']);

        return response()->json($disciplina, 200);
    }

    public function update(Request $request, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $disciplina);

        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'carga_horaria_anual' => ['sometimes', 'required', 'integer', 'min:1'],
            'descricao' => ['nullable', 'string', 'max:1000'],
        ]);

        $disciplina->update($validated);

        return response()->json($disciplina, 200);
    }

    public function destroy(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('delete', $disciplina);

        $disciplina->delete();

        return response()->json(null, 204);
    }

    public function vincularProfessor(Request $request, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $disciplina);

        $validated = $request->validate([
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'professor_id' => ['required', 'exists:users,id'],
        ]);

        $vinculo = TurmaDisciplina::updateOrCreate(
            [
                'turma_id' => $validated['turma_id'],
                'disciplina_id' => $disciplina->id_disciplina,
            ],
            [
                'professor_id' => $validated['professor_id'],
            ]
        );

        return response()->json($vinculo->load(['turma', 'disciplina', 'professor:id,name,email']), 200);
    }
}
