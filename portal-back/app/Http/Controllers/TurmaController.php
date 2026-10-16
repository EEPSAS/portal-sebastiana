<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreTurmaRequest;
use App\Http\Requests\UpdateTurmaRequest;
use App\Http\Resources\AlunoTurmaResource;
use App\Http\Resources\NotaResource;
use App\Http\Resources\TurmaResource;
use App\Http\Resources\TurmaResumoResource;
use App\Http\Resources\UsuarioResource;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use App\Services\EspecialistaDashboardService;
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
     * Remove uma turma escolar, impedindo exclusão se houver alunos com matrícula ativa.
     *
     * @return JsonResponse Retorno HTTP 204 ou 422
     */
    public function destroy(Turma $turma): JsonResponse
    {
        Gate::authorize('delete', $turma);

        // Bloqueia a exclusão caso ainda existam alunos matriculados ativos
        if ($turma->matriculas()->where('status_matricula', 'Ativo')->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir uma turma que possui estudantes com matrícula ativa. Desvincule ou transfira os alunos primeiro.',
            ], 422);
        }

        $turma->delete();

        return response()->json(null, 204);
    }

    /**
     * Retorna o resumo analítico consolidado de todas as turmas (médias, frequência e alunos).
     * Otimizado para alimentar cards de KPI e gráficos no painel sem requisições N+1.
     */
    public function resumoGeral(Request $request, EspecialistaDashboardService $dashboardService): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->canManageAcademic() && ! $user->isProfessor())) {
            abort(403, 'Acesso restrito ao corpo docente e pedagógico.');
        }

        $turmas = Turma::query()->orderBy('nome_identificador')->get();
        $resultado = [];

        foreach ($turmas as $turma) {
            $resumo = $dashboardService->obterResumoGerencial($turma);
            $resultado[] = [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
                'turno' => $turma->turno,
                'ano_letivo' => $turma->ano_letivo,
                'status' => $turma->status,
                'total_alunos' => $resumo['turma']['total_alunos'] ?? 0,
                'media_geral' => $resumo['kpis']['media_geral_turma'] ?? 0.0,
                'taxa_presenca' => $resumo['kpis']['taxa_presenca'] ?? 0.0,
                'taxa_absenteismo' => $resumo['kpis']['taxa_absenteismo'] ?? 0.0,
                'total_avaliados' => $resumo['kpis']['total_alunos_avaliados'] ?? 0,
            ];
        }

        return response()->json(TurmaResumoResource::collection(collect($resultado)), 200);
    }

    /**
     * Lista os alunos matriculados na turma encapsulados pelo AlunoTurmaResource.
     */
    public function alunos(Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $alunos = $turma->alunos()->orderBy('name')->get();

        return response()->json(AlunoTurmaResource::collection($alunos), 200);
    }

    /**
     * Retorna os alunos cadastrados no sistema que não possuem matrícula ativa nesta turma.
     * Utilizado para popular o modal de vínculo de alunos pelo Especialista ou Administrador.
     */
    public function alunosDisponiveis(Request $request, Turma $turma): JsonResponse
    {
        Gate::authorize('update', $turma);

        // Identificadores de usuários já matriculados como ativos na turma
        $matriculadosIds = $turma->matriculas()
            ->where('status_matricula', 'Ativo')
            ->pluck('usuario_id');

        // Busca usuários com papel aluno e que não estão matriculados nesta turma
        $query = User::query()
            ->where('role', UserRole::ALUNO)
            ->whereNotIn('id', $matriculadosIds);

        // Suporte opcional a filtro de busca por nome ou e-mail
        if ($request->filled('q')) {
            $termo = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($termo) {
                $q->where('name', 'like', $termo)
                    ->orWhere('email', 'like', $termo);
            });
        }

        $alunos = $query->orderBy('name')->limit(50)->get(['id', 'name', 'email']);

        return response()->json(UsuarioResource::collection($alunos), 200);
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
     * Suporta filtros por período letivo, disciplina e estudante individual.
     */
    public function notas(Request $request, Turma $turma): JsonResponse
    {
        Gate::authorize('view', $turma);

        $query = $turma->notas()->with([
            'aluno:id,name,email',
            'disciplina:id_disciplina,nome',
        ]);

        // Filtro temporal por período letivo (ex: '1º Trimestre')
        if ($request->filled('periodo_letivo')) {
            $query->where('periodo_letivo', $request->query('periodo_letivo'));
        }

        // Filtro por componente curricular específico
        if ($request->filled('disciplina_id')) {
            $query->where('disciplina_id', $request->query('disciplina_id'));
        }

        // Filtro por aluno individual para evitar carregar todas as notas da turma de uma vez
        if ($request->filled('aluno_id')) {
            $query->where('usuario_id', $request->query('aluno_id'));
        } elseif ($request->filled('usuario_id')) {
            $query->where('usuario_id', $request->query('usuario_id'));
        }

        return response()->json(NotaResource::collection($query->orderByDesc('id_nota')->get()), 200);
    }

    /**
     * Exclui os dados acadêmicos (notas e frequências) carregados via CSV para a turma.
     * Permite filtrar opcionalmente por período letivo (ex: '1º Trimestre').
     */
    public function excluirDadosCsv(Request $request, Turma $turma): JsonResponse
    {
        // Autorização didática: restrito a usuários com privilégios de gestão acadêmica (Especialista ou Adm)
        $user = $request->user();
        if (! $user || ! $user->canManageAcademic()) {
            abort(403, 'Acesso restrito ao perfil de Especialista Pedagógico ou Administrador.');
        }

        $periodoLetivo = $request->input('periodo_letivo') ?? $request->query('periodo_letivo');

        // 1. Exclusão das notas da turma (filtrando pelo período caso informado)
        $queryNotas = $turma->notas();
        if (! empty($periodoLetivo)) {
            $queryNotas->where('periodo_letivo', $periodoLetivo);
        }
        $notasRemovidas = $queryNotas->delete();

        // 2. Exclusão das faltas/frequências registradas para a turma
        $queryFreq = Frequencia::where('turma_id', $turma->id_turma);
        if (! empty($periodoLetivo)) {
            // Mapeia o trimestre escolar para os meses de realização das aulas
            if (str_contains($periodoLetivo, '1º')) {
                $queryFreq->whereMonth('data_aula', '<=', 4);
            } elseif (str_contains($periodoLetivo, '2º')) {
                $queryFreq->whereMonth('data_aula', '>=', 5)->whereMonth('data_aula', '<=', 8);
            } elseif (str_contains($periodoLetivo, '3º')) {
                $queryFreq->whereMonth('data_aula', '>=', 9);
            }
        }
        $frequenciasRemovidas = $queryFreq->delete();

        $mensagemPeriodo = ! empty($periodoLetivo) ? " do período '{$periodoLetivo}'" : '';

        return response()->json([
            'message' => "Dados do diário escolar{$mensagemPeriodo} excluídos com sucesso.",
            'notas_removidas' => $notasRemovidas,
            'frequencias_removidas' => $frequenciasRemovidas,
        ], 200);
    }
}
