<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTurmaRequest;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pela gestão de turmas escolares e grade curricular.
class TurmaController extends Controller
{
    // Lista as turmas cadastradas com suporte a filtros por ano, status e turno.
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

    // Cria e persiste uma nova turma.
    public function store(StoreTurmaRequest $request): JsonResponse
    {
        Gate::authorize('create', Turma::class);

        $turma = Turma::create($request->validated());

        return response()->json($turma, 201);
    }

    // Exibe detalhes de uma turma específica e contadores associados.
    public function show(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $turma->loadCount(['alunos', 'disciplinas']);

        return response()->json($turma, 200);
    }

    // Atualiza os dados cadastrais da turma.
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

    // Exclui uma turma do sistema.
    public function destroy(Turma $turma): JsonResponse
    {
        Gate::authorize('delete', $turma);

        $turma->delete();

        return response()->json(null, 204);
    }

    // Lista os alunos matriculados na turma.
    public function alunos(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $alunos = $turma->alunos()->orderBy('name')->get();

        return response()->json($alunos, 200);
    }

    // Lista as disciplinas e respectivos professores vinculados à turma.
    public function disciplinas(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $disciplinas = $turma->turmaDisciplinas()
            ->with(['disciplina', 'professor:id,name,email'])
            ->get();

        return response()->json($disciplinas, 200);
    }

    // Vincula uma disciplina à turma, com professor responsável opcional.
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

    // Remove o vínculo de uma disciplina com a turma.
    public function desvincularDisciplina(Turma $turma, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $turma);

        TurmaDisciplina::where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplina->id_disciplina)
            ->delete();

        return response()->json(null, 204);
    }

    // Lista as notas e avaliações registradas para os alunos desta turma.
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
