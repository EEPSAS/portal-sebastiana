<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
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

        // Contagem global de professores aguardando validação escolar
        $pendentesCount = User::where('role', UserRole::PROFESSOR)
            ->where('status_confirmacao', 'pendente')
            ->count();

        return response()->json([
            'data' => ProfessorResource::collection($professores),
            'meta' => [
                'total' => $professores->count(),
                'pendentes_count' => $pendentesCount,
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
     * Confirma o pertencimento do professor à Escola Sebastiana.
     *
     * PATCH /api/professores/{professor}/confirmar
     */
    public function confirmar(Request $request, User $professor): JsonResponse
    {
        $this->autorizarGestao($request);

        if (! $professor->isProfessor()) {
            abort(404, 'Usuário informado não é um professor.');
        }

        $professor->update([
            'status_confirmacao' => 'confirmado',
            'confirmado_em' => now(),
        ]);

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

        // 1. Registra o vínculo direto em disciplina_professores
        $professor->disciplinasDocente()->syncWithoutDetaching([$disciplinaId]);

        // 2. Propaga a regência docente para as turmas escolares onde a disciplina já existe
        TurmaDisciplina::where('disciplina_id', $disciplinaId)
            ->update(['professor_id' => $professor->id]);

        // 3. Para as turmas ativas que ainda não possuem registro nesta disciplina, cria a vinculação
        $turmasAtivas = Turma::where('status', 'Ativa')->get();
        foreach ($turmasAtivas as $turma) {
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

        $professor->load(['disciplinasDocente', 'turmaDisciplinasDocente.turma']);

        return response()->json([
            'message' => "Disciplina '{$disciplina->nome}' vinculada com sucesso ao professor {$professor->name}.",
            'data' => new ProfessorResource($professor),
        ], 200);
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
