<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\ConfirmarProfessorRequest;
use App\Http\Requests\VincularProfessorDisciplinaRequest;
use App\Http\Resources\ProfessorResource;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller responsável pela gestão do perfil de professores pelo Especialista Pedagógico.
 *
 * Papel Didático:
 * Atende às necessidades institucionais da escola:
 * 1. Confirmação do pertencimento do docente à instituição (evitando acessos indevidos via Google);
 * 2. Vínculo direto do professor com disciplinas curriculares (refletindo nas turmas da grade);
 * 3. Alimentação dos dados analíticos e notas para o Geral do Professor.
 */
class ProfessorController extends Controller
{
    /**
     * Verifica se o usuário autenticado possui perfil de Especialista ou Administrador.
     */
    protected function autorizarGestao(Request $request): void
    {
        $user = $request->user();

        if (! $user || (! $user->isAdm() && ! $user->isEspecialista() && ! $user->canManageAcademic())) {
            abort(403, 'Acesso restrito à equipe do Especialista Pedagógico e Administrador.');
        }
    }

    /**
     * Lista os professores cadastrados na instituição com filtros e contagem de pendências.
     *
     * GET /api/professores
     */
    public function index(Request $request): JsonResponse
    {
        $this->autorizarGestao($request);

        $query = User::where('role', UserRole::PROFESSOR)
            ->with(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        // Filtro por termo de busca (nome ou e-mail institucional)
        if ($request->filled('q')) {
            $termo = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($termo) {
                $q->where('name', 'like', $termo)
                    ->orWhere('email', 'like', $termo);
            });
        }

        // Filtro por status de confirmação ('pendente', 'confirmado', 'rejeitado')
        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'pendente') {
                $query->where('status_confirmacao', 'pendente');
            } elseif ($status === 'confirmado') {
                $query->where(function ($q) {
                    $q->where('status_confirmacao', 'confirmado')
                        ->orWhereNull('status_confirmacao');
                });
            } elseif ($status === 'rejeitado') {
                $query->where('status_confirmacao', 'rejeitado');
            }
        }

        $professores = $query->orderBy('name')->get();

        // Contagem global de professores e alunos aguardando validação escolar (Item 2.4)
        $pendentesCount = User::where('role', UserRole::PROFESSOR)
            ->where('status_confirmacao', 'pendente')
            ->count();

        $alunosPendentesCount = User::where('role', UserRole::ALUNO)
            ->where('status_confirmacao', 'pendente')
            ->count();

        return response()->json([
            'data' => ProfessorResource::collection($professores),
            'meta' => [
                'total' => $professores->count(),
                'pendentes_count' => $pendentesCount,
                'alunos_pendentes_count' => $alunosPendentesCount,
                'total_aprovacoes_pendentes' => $pendentesCount + $alunosPendentesCount,
            ],
        ], 200);
    }

    /**
     * Detalha as informações de um professor específico.
     *
     * GET /api/professores/{professor}
     */
    public function show(Request $request, User $professor): JsonResponse
    {
        $this->autorizarGestao($request);

        if (! $professor->isProfessor()) {
            abort(404, 'Usuário informado não é um professor.');
        }

        $professor->load(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        return response()->json(new ProfessorResource($professor), 200);
    }

    /**
     * Confirma o pertencimento do professor à Escola Sebastiana e registra o vínculo
     * com a(s) disciplina(s) selecionada(s) quando informadas (Itens 2.3.2 e 3.2a).
     *
     * PATCH /api/professores/{professor}/confirmar
     */
    public function confirmar(ConfirmarProfessorRequest $request, User $professor): JsonResponse
    {
        $this->autorizarGestao($request);

        if (! $professor->isProfessor()) {
            abort(404, 'Usuário informado não é um professor.');
        }

        // Registra formalmente o vínculo escolar e quem autorizou (Itens 1.3.4 e 2.3.2)
        $professor->registrarVinculoEscolar(
            $request->user()->id,
            'Professor confirmado na instituição pelo Especialista/Admin.'
        );

        // Coleta as disciplinas informadas no ato da aprovação (Item 2.3.2)
        $validated = $request->validated();
        $disciplinaIds = collect($validated['disciplina_ids'] ?? [])
            ->when(! empty($validated['disciplina_id']), fn ($c) => $c->push((int) $validated['disciplina_id']))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        foreach ($disciplinaIds as $disciplinaId) {
            $this->aplicarVinculoDisciplina($professor, $disciplinaId);
        }

        $professor->load(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        return response()->json([
            'message' => "Professor(a) {$professor->name} confirmado(a) com sucesso na instituição.",
            'data' => new ProfessorResource($professor),
        ], 200);
    }

    /**
     * Rejeita a solicitação de acesso do professor.
     *
     * PATCH /api/professores/{professor}/recusar
     */
    public function recusar(Request $request, User $professor): JsonResponse
    {
        $this->autorizarGestao($request);

        if (! $professor->isProfessor()) {
            abort(404, 'Usuário informado não é um professor.');
        }

        $professor->update([
            'status_confirmacao' => 'rejeitado',
            'confirmado_em' => null,
        ]);

        // Remove quaisquer vínculos docentes associados
        $professor->disciplinasDocente()->detach();
        TurmaDisciplina::where('professor_id', $professor->id)->update(['professor_id' => null]);

        $professor->load(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        return response()->json([
            'message' => "Acesso institucional do professor(a) {$professor->name} recusado.",
            'data' => new ProfessorResource($professor),
        ], 200);
    }

    /**
     * Vincula o professor diretamente a uma disciplina curricular.
     * Conforme a regra de negócio definida, a matéria é atribuída nas turmas ativas da instituição.
     *
     * POST /api/professores/{professor}/vincular-disciplina
     */
    public function vincularDisciplina(VincularProfessorDisciplinaRequest $request, User $professor): JsonResponse
    {
        $this->autorizarGestao($request);

        if (! $professor->isProfessor()) {
            abort(404, 'Usuário informado não é um professor.');
        }

        // Exige que o professor esteja formalmente confirmado antes de assumir turmas e notas
        if ($professor->isProfessorPendente()) {
            return response()->json([
                'message' => 'Não é permitido vincular disciplinas a um professor com confirmação pendente. Confirme o professor primeiro.',
            ], 422);
        }

        $disciplinaId = (int) $request->validated('disciplina_id');
        $disciplina = Disciplina::findOrFail($disciplinaId);

        $this->aplicarVinculoDisciplina($professor, $disciplinaId);

        $professor->load(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        return response()->json([
            'message' => "Disciplina '{$disciplina->nome}' vinculada com sucesso ao professor {$professor->name}.",
            'data' => new ProfessorResource($professor),
        ], 200);
    }

    /**
     * Aplica o vínculo do professor com a disciplina e propaga para as turmas dos Ciclos
     * aos quais a disciplina pertence (ou turmas ativas se a disciplina ainda não tiver ciclo).
     */
    private function aplicarVinculoDisciplina(User $professor, int $disciplinaId): void
    {
        $disciplina = Disciplina::with('ciclos.turmas')->findOrFail($disciplinaId);

        // 1. Registra o vínculo direto em disciplina_professores
        $professor->disciplinasDocente()->syncWithoutDetaching([$disciplinaId]);

        // 2. Propaga a regência docente para as turmas onde a disciplina já está alocada
        TurmaDisciplina::where('disciplina_id', $disciplinaId)
            ->update(['professor_id' => $professor->id]);

        // 3. Se a disciplina pertence a Ciclos Escolares, propaga para as turmas desses Ciclos;
        // caso contrário, propaga para todas as turmas ativas (comportamento compatível).
        $turmasAlvo = $disciplina->ciclos->isNotEmpty()
            ? $disciplina->ciclos->flatMap(fn ($ciclo) => $ciclo->turmas)->unique('id_turma')
            : Turma::where('status', 'Ativa')->get();

        foreach ($turmasAlvo as $turma) {
            TurmaDisciplina::firstOrCreate(
                [
                    'turma_id' => $turma->id_turma,
                    'disciplina_id' => $disciplinaId,
                ],
                [
                    'professor_id' => $professor->id,
                ]
            );
        }
    }

    /**
     * Desvincula o professor de uma disciplina curricular.
     *
     * DELETE /api/professores/{professor}/desvincular-disciplina/{disciplina}
     */
    public function desvincularDisciplina(Request $request, User $professor, Disciplina $disciplina): JsonResponse
    {
        $this->autorizarGestao($request);

        if (! $professor->isProfessor()) {
            abort(404, 'Usuário informado não é um professor.');
        }

        // 1. Remove da tabela pivô direta
        $professor->disciplinasDocente()->detach($disciplina->id_disciplina);

        // 2. Desassocia o professor das turmas que ministrava esta disciplina
        TurmaDisciplina::where('disciplina_id', $disciplina->id_disciplina)
            ->where('professor_id', $professor->id)
            ->update(['professor_id' => null]);

        $professor->load(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        return response()->json([
            'message' => "Disciplina '{$disciplina->nome}' desvinculada com sucesso do professor {$professor->name}.",
            'data' => new ProfessorResource($professor),
        ], 200);
    }
}
