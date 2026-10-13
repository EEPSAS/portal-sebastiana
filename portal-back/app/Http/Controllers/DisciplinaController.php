<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisciplinaRequest;
use App\Http\Resources\DisciplinaResource;
use App\Models\Disciplina;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo cadastro de disciplinas e vinculação docente.
 */
class DisciplinaController extends Controller
{
    /**
     * Lista as disciplinas curriculares cadastradas.
     *
     * @return JsonResponse Coleção de disciplinas formatada pelo DisciplinaResource
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Disciplina::class);

        $query = Disciplina::query();

        if ($request->filled('q')) {
            $query->where('nome_disciplina', 'like', '%'.$request->string('q')->toString().'%');
        }

        $disciplinas = $query->orderBy('nome_disciplina')->get();

        return response()->json(DisciplinaResource::collection($disciplinas), 200);
    }

    /**
     * Cadastra e persiste uma nova disciplina.
     *
     * @param  StoreDisciplinaRequest  $request  Form Request validada
     */
    public function store(StoreDisciplinaRequest $request): JsonResponse
    {
        Gate::authorize('create', Disciplina::class);

        $disciplina = Disciplina::create($request->validated());

        return response()->json(new DisciplinaResource($disciplina), 201);
    }

    /**
     * Exibe os detalhes de uma disciplina.
     */
    public function show(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('view', $disciplina);

        return response()->json(new DisciplinaResource($disciplina), 200);
    }

    /**
     * Atualiza os dados cadastrais da disciplina.
     */
    public function update(Request $request, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $disciplina);

        $validated = $request->validate([
            'nome_disciplina' => ['sometimes', 'required', 'string', 'max:255'],
            'codigo' => ['sometimes', 'nullable', 'string', 'max:50'],
            'carga_horaria' => ['sometimes', 'required', 'integer', 'min:1'],
        ]);

        $disciplina->update($validated);

        return response()->json(new DisciplinaResource($disciplina), 200);
    }

    /**
     * Exclui uma disciplina do catálogo.
     *
     * @return JsonResponse Retorno HTTP 204
     */
    public function destroy(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('delete', $disciplina);

        $disciplina->delete();

        return response()->json(null, 204);
    }

    /**
     * Vincula o professor responsável por lecionar uma disciplina em determinada turma.
     */
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
