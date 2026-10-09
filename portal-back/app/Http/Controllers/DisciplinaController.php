<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisciplinaRequest;
use App\Models\Disciplina;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pela gestão de disciplinas e vínculo com docentes.
class DisciplinaController extends Controller
{
    // Lista as disciplinas cadastradas, com filtro opcional por termo de busca.
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Disciplina::class);

        $query = Disciplina::query();

        if ($request->filled('q')) {
            $query->where('nome', 'like', '%'.$request->string('q')->toString().'%');
        }

        return response()->json($query->orderBy('nome')->get(), 200);
    }

    // Cria e persiste uma nova disciplina.
    public function store(StoreDisciplinaRequest $request): JsonResponse
    {
        Gate::authorize('create', Disciplina::class);

        $disciplina = Disciplina::create($request->validated());

        return response()->json($disciplina, 201);
    }

    // Exibe os detalhes de uma disciplina e suas turmas associadas.
    public function show(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('view', $disciplina);

        $disciplina->load(['turmas']);

        return response()->json($disciplina, 200);
    }

    // Atualiza os dados cadastrais da disciplina.
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

    // Exclui uma disciplina do sistema.
    public function destroy(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('delete', $disciplina);

        $disciplina->delete();

        return response()->json(null, 204);
    }

    // Vincula ou atualiza o professor responsável por uma disciplina em determinada turma.
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
