<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportarRelatorioTurmaRequest;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Services\EspecialistaDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller que gerencia as operações analíticas e de inteligência pedagógica
 * para o "Dashboard do Especialista".
 */
class EspecialistaDashboardController extends Controller
{
    /**
     * Injeção de dependência do serviço de inteligência pedagógica.
     */
    public function __construct(
        protected EspecialistaDashboardService $dashboardService
    ) {}

    /**
     * POST /api/turmas/{turma_id}/importar-relatorio
     *
     * Recebe um arquivo de diário escolar (CSV), mapeia colunas dinamicamente
     * e sincroniza notas e faltas dos alunos da turma.
     */
    public function importarRelatorio(ImportarRelatorioTurmaRequest $request, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoEspecialista($request);

        $turma = Turma::findOrFail($turma_id);

        $arquivo = $request->file('arquivo') ?? $request->file('planilha');
        $periodo = $request->input('periodo_letivo');
        $dataAula = $request->input('data_aula');

        $resultado = $this->dashboardService->processarPlanilhaConsolidada(
            $turma,
            $arquivo,
            $periodo,
            $dataAula
        );

        return response()->json([
            'message' => 'Relatório da turma importado e sincronizado com sucesso.',
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'dados' => $resultado,
        ], 200);
    }

    /**
     * GET /api/turmas/{turma_id}/resumo-gerencial
     *
     * Retorna os KPIs principais da turma (Média geral agregada, Taxa de faltas,
     * e a distribuição percentual nas faixas: Excelentes, Na Média e Críticos).
     * Suporta filtro opcional via query param ?trimestre=1 ou ?periodo=1º Bimestre.
     */
    public function resumoGerencial(Request $request, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoEspecialista($request);

        $turma = Turma::findOrFail($turma_id);
        $periodo = $this->obterPeriodoFiltro($request);

        $resumo = $this->dashboardService->obterResumoGerencial($turma, $periodo);

        return response()->json($resumo, 200);
    }

    /**
     * GET /api/turmas/{turma_id}/desempenho-componentes
     *
     * Retorna o ranking das disciplinas ordenadas da pior para a melhor média,
     * identificando os gargalos de aprendizado da turma.
     */
    public function desempenhoComponentes(Request $request, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoEspecialista($request);

        $turma = Turma::findOrFail($turma_id);
        $periodo = $this->obterPeriodoFiltro($request);

        $ranking = $this->dashboardService->calcularDesempenhoPorComponente($turma, $periodo);

        return response()->json([
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'periodo_selecionado' => $periodo ?: 'Geral',
            'ranking_componentes' => $ranking,
        ], 200);
    }

    /**
     * GET /api/turmas/{turma_id}/alunos-criticos
     *
     * Retorna a lista de alunos em risco global (múltiplas notas vermelhas
     * ou taxa de faltas estourada).
     */
    public function alunosCriticos(Request $request, int|string $turma_id): JsonResponse
    {
        $this->autorizarAcessoEspecialista($request);

        $turma = Turma::findOrFail($turma_id);
        $periodo = $this->obterPeriodoFiltro($request);

        $alunosCriticos = $this->dashboardService->listarAlunosCriticos($turma, $periodo);

        return response()->json([
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'periodo_selecionado' => $periodo ?: 'Geral',
            'total_criticos' => count($alunosCriticos),
            'alunos_criticos' => $alunosCriticos,
        ], 200);
    }

    /**
     * GET /api/turmas/{turma_id}/disciplinas/{disciplina_id}/analise-detalhada
     *
     * Retorna estatísticas da turma focadas em uma única matéria (Média da turma na matéria,
     * Maior Nota, Menor Nota, Total de faltas acumuladas e taxa de presença).
     */
    public function analiseDetalhada(
        Request $request,
        int|string $turma_id,
        int|string $disciplina_id
    ): JsonResponse {
        $this->autorizarAcessoEspecialista($request);

        $turma = Turma::findOrFail($turma_id);
        $disciplina = Disciplina::findOrFail($disciplina_id);
        $periodo = $this->obterPeriodoFiltro($request);

        $analise = $this->dashboardService->detalharDesempenhoDaTurmaPorComponente(
            $turma,
            $disciplina,
            $periodo
        );

        return response()->json($analise, 200);
    }

    /**
     * GET /api/turmas/{turma_id}/disciplinas/{disciplina_id}/alunos-risco
     *
     * Retorna os alunos que estão com nota vermelha ou excesso de faltas exclusivamente
     * na disciplina consultada.
     */
    public function alunosRisco(
        Request $request,
        int|string $turma_id,
        int|string $disciplina_id
    ): JsonResponse {
        $this->autorizarAcessoEspecialista($request);

        $turma = Turma::findOrFail($turma_id);
        $disciplina = Disciplina::findOrFail($disciplina_id);
        $periodo = $this->obterPeriodoFiltro($request);

        $alunosRisco = $this->dashboardService->listarAlunosEmRiscoNoComponente(
            $turma,
            $disciplina,
            $periodo
        );

        return response()->json([
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'disciplina' => [
                'id_disciplina' => $disciplina->id_disciplina,
                'nome' => $disciplina->nome,
            ],
            'periodo_selecionado' => $periodo ?: 'Geral',
            'total_em_risco' => count($alunosRisco),
            'alunos_em_risco' => $alunosRisco,
        ], 200);
    }

    /**
     * Valida se o usuário autenticado possui perfil de Especialista ou Administrador
     * com privilégios para gerenciar dados acadêmicos.
     */
    protected function autorizarAcessoEspecialista(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->canManageAcademic()) {
            abort(403, 'Acesso restrito ao perfil de Especialista Pedagógico ou Administrador.');
        }
    }

    /**
     * Extrai o período desejado a partir de ?trimestre=1 ou ?periodo=1º Bimestre.
     */
    protected function obterPeriodoFiltro(Request $request): ?string
    {
        if ($request->has('trimestre')) {
            return (string) $request->query('trimestre');
        }

        if ($request->has('periodo')) {
            return (string) $request->query('periodo');
        }

        if ($request->has('periodo_letivo')) {
            return (string) $request->query('periodo_letivo');
        }

        return null;
    }
}
