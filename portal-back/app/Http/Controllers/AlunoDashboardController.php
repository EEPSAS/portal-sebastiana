<?php

namespace App\Http\Controllers;

use App\Models\Disciplina;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\User;
use App\Services\AlunoDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller responsável pelos endpoints do Dashboard do Aluno,
 * fornecendo médias, frequências, comparativos com a turma e alertas de risco.
 */
class AlunoDashboardController extends Controller
{
    /**
     * Injeção do serviço especializado do Dashboard do Aluno.
     */
    public function __construct(
        protected AlunoDashboardService $alunoDashboardService
    ) {}

    /**
     * GET /api/alunos/{aluno_id}/turmas/{turma_id}/resumo-global
     *
     * Retorna a média geral, a frequência global e os alertas de risco do aluno na turma.
     * Suporta filtro temporal opcional via query param ?trimestre=1.
     */
    public function resumoGlobal(Request $request, int|string $aluno_id, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoAluno($request, (int) $aluno_id);
        $this->validarMatriculaAlunoNaTurma((int) $aluno_id, (int) $turma_id);

        $trimestre = $this->obterParametroTrimestre($request);

        $resumo = $this->alunoDashboardService->obterResumoGlobal(
            $aluno_id,
            $turma_id,
            $trimestre
        );

        return response()->json($resumo, 200);
    }

    /**
     * GET /api/alunos/{aluno_id}/turmas/{turma_id}/boletim
     *
     * Retorna o boletim trimestral ou consolidado agrupado por disciplina,
     * incluindo nota obtida, somatório de faltas e status calculado.
     */
    public function boletim(Request $request, int|string $aluno_id, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoAluno($request, (int) $aluno_id);
        $this->validarMatriculaAlunoNaTurma((int) $aluno_id, (int) $turma_id);

        $trimestre = $this->obterParametroTrimestre($request);

        $boletim = $this->alunoDashboardService->obterBoletimTrimestral(
            $aluno_id,
            $turma_id,
            $trimestre
        );

        return response()->json($boletim, 200);
    }

    /**
     * GET /api/alunos/{aluno_id}/turmas/{turma_id}/comparativo-turma
     *
     * Retorna os dados comparativos pareados por disciplina para alimentar
     * o Gráfico de Radar (nota_aluno, faltas_aluno, media_turma e media_faltas_turma).
     */
    public function comparativoTurma(Request $request, int|string $aluno_id, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoAluno($request, (int) $aluno_id);
        $this->validarMatriculaAlunoNaTurma((int) $aluno_id, (int) $turma_id);

        $trimestre = $this->obterParametroTrimestre($request);

        $comparativo = $this->alunoDashboardService->obterComparativoAlunoVsTurma(
            $aluno_id,
            $turma_id,
            $trimestre
        );

        return response()->json($comparativo, 200);
    }

    /**
     * GET /api/alunos/{aluno_id}/turmas/{turma_id}/disciplinas/{disciplina_id}/desempenho
     *
     * Rota de detalhamento por componente curricular:
     * - Diferença da nota para a média escolar e pontos restantes para aprovação.
     * - Percentual isolado de faltas e saldo de faltas permitidas antes da reprovação.
     */
    public function desempenhoDisciplina(
        Request $request,
        int|string $aluno_id,
        int|string $turma_id,
        int|string $disciplina_id
    ): JsonResponse {
        $this->autorizarAcessoAluno($request, (int) $aluno_id);
        $this->validarMatriculaAlunoNaTurma((int) $aluno_id, (int) $turma_id);

        // Valida se a disciplina existe
        Disciplina::findOrFail($disciplina_id);

        $trimestre = $this->obterParametroTrimestre($request);

        $desempenho = $this->alunoDashboardService->obterDesempenhoCompletoComponente(
            $aluno_id,
            $turma_id,
            $disciplina_id,
            $trimestre
        );

        return response()->json($desempenho, 200);
    }

    /**
     * Autoriza o acesso garantindo que o usuário logado é o próprio estudante
     * ou possui privilégios de gestão pedagógica/administrativa.
     */
    protected function autorizarAcessoAluno(Request $request, int $alunoId): void
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Não autenticado.');
        }

        // Se for o próprio estudante, acesso liberado
        if ($user->id === $alunoId) {
            return;
        }

        // Professores, Especialistas e Administradores podem consultar o dashboard de qualquer aluno
        if ($user->canManageAcademic() || $user->isAdm() || $user->isEspecialista()) {
            return;
        }

        abort(403, 'Acesso restrito. Você só possui permissão para visualizar seu próprio painel acadêmico.');
    }

    /**
     * Valida se o aluno informado existe e possui matrícula vinculada à turma.
     */
    protected function validarMatriculaAlunoNaTurma(int $alunoId, int $turmaId): void
    {
        // Garante que o usuário e turma existem
        User::findOrFail($alunoId);
        Turma::findOrFail($turmaId);

        $matriculaExiste = Matricula::where('usuario_id', $alunoId)
            ->where('turma_id', $turmaId)
            ->exists();

        if (! $matriculaExiste) {
            abort(404, 'O estudante informado não está matriculado nesta turma.');
        }
    }

    /**
     * Extrai o valor do query param ?trimestre ou ?periodo da requisição.
     */
    protected function obterParametroTrimestre(Request $request): ?string
    {
        if ($request->has('trimestre')) {
            return (string) $request->query('trimestre');
        }

        if ($request->has('periodo')) {
            return (string) $request->query('periodo');
        }

        return null;
    }
}
