<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTurmaRequest;
use App\Http\Requests\UpdateTurmaRequest;
use App\Http\Resources\TurmaResource;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pela consulta e gestão de turmas escolares.
 */
class TurmaController extends Controller
{
    /**
     * Lista turmas cadastradas com contagem de alunos e disciplinas.
     *
     * @return JsonResponse Coleção de turmas formatada pelo TurmaResource
     */
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

        $turmas = $query->orderBy('nome_identificador')->get();

        return response()->json(TurmaResource::collection($turmas), 200);
    }

    /**
     * Cria e persiste uma nova turma escolar.
     */
    public function store(StoreTurmaRequest $request): JsonResponse
    {
        Gate::authorize('create', Turma::class);

        $turma = Turma::create($request->validated());
        $turma->loadCount(['alunos', 'disciplinas']);

        return response()->json(new TurmaResource($turma), 201);
    }

    /**
     * Exibe os detalhes de uma turma específica.
     */
    public function show(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $turma->loadCount(['alunos', 'disciplinas']);

        return response()->json(new TurmaResource($turma), 200);
    }

    /**
     * Atualiza os dados cadastrais da turma utilizando Form Request.
     *
     * @param  UpdateTurmaRequest  $request  Form Request validada
     */
    public function update(UpdateTurmaRequest $request, Turma $turma): JsonResponse
    {
        Gate::authorize('update', $turma);

        $turma->update($request->validated());
        $turma->loadCount(['alunos', 'disciplinas']);

        return response()->json(new TurmaResource($turma), 200);
    }

    /**
     * Remove uma turma escolar.
     *
     * @return JsonResponse Retorno HTTP 204
     */
    public function destroy(Turma $turma): JsonResponse
    {
        Gate::authorize('delete', $turma);

        $turma->delete();

        return response()->json(null, 204);
    }

    /**
     * Lista os alunos matriculados na turma (acesso consultivo).
     */
    public function alunos(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $alunos = $turma->alunos()->orderBy('name')->get();

        return response()->json($alunos, 200);
    }

    /**
     * Lista as disciplinas e os professores vinculados à turma.
     */
    public function disciplinas(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $disciplinas = $turma->turmaDisciplinas()
            ->with(['disciplina', 'professor:id,name,email'])
            ->get();

        return response()->json($disciplinas, 200);
    }

    /**
     * Vincula uma disciplina à turma com professor responsável opcional.
     */
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

    /**
     * Remove o vínculo de uma disciplina com a turma.
     */
    public function desvincularDisciplina(Turma $turma, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $turma);

        TurmaDisciplina::where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplina->id_disciplina)
            ->delete();

        return response()->json(null, 204);
    }

    /**
     * Consulta as notas consolidadas registradas para a turma via CSV.
     */
    public function notas(Request $request, Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $query = $turma->notas()->with([
            'aluno:id,name,email',
            'disciplina:id_disciplina,nome',
        ]);

        if ($request->filled('periodo_letivo')) {
            $query->where('periodo_letivo', $request->query('periodo_letivo'));
        }

        if ($request->filled('disciplina_id')) {
            $query->where('disciplina_id', $request->query('disciplina_id'));
        }

        return response()->json($query->orderByDesc('id_nota')->get(), 200);
    }
}
