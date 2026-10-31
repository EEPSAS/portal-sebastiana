<?php

namespace App\Services;

use App\Enums\EmprestimoStatus;
use App\Models\Disciplina;
use App\Models\Emprestimo;
use App\Models\Evento;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Service responsável pela inteligência de dados e regras de negócio
 * para alimentar a visão individual do "Dashboard do Aluno".
 */
class AlunoDashboardService
{
    /**
     * Calcula a média geral do aluno na turma no período informado.
     * Faz a busca na tabela de notas filtrando por aluno, turma e período,
     * retornando a média aritmética do valor_nota em formato decimal.
     */
    public function calcularMediaGeralAluno(int|string $alunoId, int|string $turmaId, ?string $trimestre = null): float
    {
        $query = Nota::where('turma_id', $turmaId)
            ->where('usuario_id', $alunoId);

        $this->aplicarFiltroPeriodo($query, $trimestre);

        $media = $query->avg('valor_nota');

        return $media !== null ? round((float) $media, 2) : 0.0;
    }

    /**
     * Calcula o percentual de frequência global do aluno na turma.
     * Soma a quantidade_aulas onde o status_presenca é "Falta",
     * subtraindo do total de aulas dadas para obter a porcentagem de presença.
     */
    public function calcularFrequenciaGlobalAluno(int|string $alunoId, int|string $turmaId, ?string $trimestre = null): float
    {
        $query = Frequencia::where('turma_id', $turmaId)
            ->where('usuario_id', $alunoId);

        $this->aplicarFiltroDataFrequencia($query, $trimestre);

        $totalAulas = (int) (clone $query)->sum('quantidade_aulas');
        if ($totalAulas === 0) {
            return 100.0;
        }

        $totalFaltas = (int) (clone $query)
            ->where('status_presenca', 'Falta')
            ->sum('quantidade_aulas');

        // Projeção proporcional didática caso apenas registros de faltas tenham sido sincronizados via CSV
        if ($totalFaltas > 0 && $totalAulas <= $totalFaltas) {
            $totalAulas = max($totalFaltas, 100);
        }

        $percentualPresenca = (($totalAulas - $totalFaltas) / $totalAulas) * 100;

        return round(max(0.0, min(100.0, (float) $percentualPresenca)), 2);
    }

    /**
     * Cruza notas e faltas do aluno e retorna a lista de disciplinas onde ele está em risco.
     * Critérios:
     * - Nota média inferior a 60% do valor máximo (ou < 6.0).
     * - Faltas que ultrapassam 20% das aulas ministradas ou da carga horária prevista.
     */
    public function listarAlertasDeRisco(int|string $alunoId, int|string $turmaId, ?string $trimestre = null): array
    {
        $turma = Turma::findOrFail($turmaId);
        $disciplinas = $this->obterDisciplinasDaTurma($turma);

        $alertas = [];

        foreach ($disciplinas as $disciplina) {
            $queryNotas = Nota::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);

            $this->aplicarFiltroPeriodo($queryNotas, $trimestre);

            $totalNotas = $queryNotas->count();
            $mediaNota = $queryNotas->avg('valor_nota');
            $valorMaximoPadrao = $this->obterValorMaximoPeriodo($trimestre);
            $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: $valorMaximoPadrao);

            $queryFreq = Frequencia::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);

            $this->aplicarFiltroDataFrequencia($queryFreq, $trimestre);

            $totalAulas = (int) (clone $queryFreq)->sum('quantidade_aulas');
            $totalFaltas = (int) (clone $queryFreq)->where('status_presenca', 'Falta')->sum('quantidade_aulas');
            $taxaFaltas = $totalAulas > 0 ? round(($totalFaltas / $totalAulas) * 100, 1) : 0.0;

            $motivos = [];

            // Regra 1: Menos de 60% do aproveitamento
            if ($totalNotas > 0 && $mediaNota !== null) {
                $aproveitamento = $valorMaximo > 0 ? ($mediaNota / $valorMaximo) * 100 : 0.0;
                if ($aproveitamento < 60.0) {
                    $mediaFormatada = round((float) $mediaNota, 2);
                    $motivos[] = "Nota abaixo de 60% ({$mediaFormatada} / {$valorMaximo})";
                }
            }

            // Regra 2: Faltas ultrapassando 20%
            if ($taxaFaltas > 20.0 || $totalFaltas >= 6) {
                $motivos[] = "Faltas elevadas na matéria ({$totalFaltas} faltas, {$taxaFaltas}% das aulas)";
            }

            if (! empty($motivos)) {
                $alertas[] = [
                    'disciplina_id' => $disciplina->id_disciplina,
                    'nome_disciplina' => $disciplina->nome,
                    'media_nota' => $mediaNota !== null ? round((float) $mediaNota, 2) : 0.0,
                    'valor_maximo' => $valorMaximo,
                    'total_faltas' => $totalFaltas,
                    'total_aulas' => $totalAulas,
                    'taxa_faltas' => $taxaFaltas,
                    'motivos' => $motivos,
                ];
            }
        }

        return $alertas;
    }

    /**
     * Retorna o resumo global completo do aluno, incluindo KPIs, alertas
     * e os objetos estruturados consumidos pelo front-end React.
     */
    public function obterResumoGlobal(int|string $alunoId, int|string $turmaId, ?string $trimestre = null): array
    {
        $aluno = User::findOrFail($alunoId);
        $turma = Turma::findOrFail($turmaId);

        $mediaGeral = $this->calcularMediaGeralAluno($alunoId, $turmaId, $trimestre);
        $frequenciaGlobal = $this->calcularFrequenciaGlobalAluno($alunoId, $turmaId, $trimestre);
        $alertasRisco = $this->listarAlertasDeRisco($alunoId, $turmaId, $trimestre);

        // Prepara dados complementares para o React (StudentStatCards)
        $studentStats = $this->montarStudentStatsFrontend($aluno, $turma, $mediaGeral, $frequenciaGlobal);

        return [
            'aluno' => [
                'id' => $aluno->id,
                'nome' => $aluno->name,
                'email' => $aluno->email,
            ],
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'periodo_selecionado' => $trimestre ? "{$trimestre}º Trimestre" : 'Consolidado Anual',
            'media_geral' => $mediaGeral,
            'frequencia_global' => $frequenciaGlobal,
            'total_alertas_risco' => count($alertasRisco),
            'alertas_risco' => $alertasRisco,
            // Objeto compatível diretamente com o hook useStudentStats e cards do front-end
            'student_stats' => $studentStats,
        ];
    }

    /**
     * Retorna o boletim trimestral do aluno agrupado por disciplina.
     * Retorna: nome da disciplina, nota obtida, somatório de faltas e status calculado.
     * Também inclui a estrutura esperada pelo gráfico em pizza do front-end (materia, pontos, cor).
     */
    public function obterBoletimTrimestral(int|string $alunoId, int|string $turmaId, ?string $trimestre = null): array
    {
        $turma = Turma::findOrFail($turmaId);
        $disciplinas = $this->obterDisciplinasDaTurma($turma);

        $boletim = [];
        $graficoBoletim = [];

        // Paleta de cores moderna correspondente à identidade visual do front-end
        $paletaCores = [
            '#0d6efd', // Azul
            '#198754', // Verde
            '#00bcd4', // Ciano
            '#d6006e', // Rosa / Magenta
            '#6f42c1', // Roxo
            '#fd7e14', // Laranja
            '#ffc107', // Amarelo
            '#dc3545', // Vermelho
            '#20c997', // Verde Água
            '#6610f2', // Índigo
        ];

        foreach ($disciplinas as $index => $disciplina) {
            $queryNotas = Nota::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);

            $this->aplicarFiltroPeriodo($queryNotas, $trimestre);

            $media = $queryNotas->avg('valor_nota');
            $notaObtida = $media !== null ? round((float) $media, 2) : 0.0;
            $valorMaximoPadrao = $this->obterValorMaximoPeriodo($trimestre);
            $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: $valorMaximoPadrao);

            $queryFreq = Frequencia::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);

            $this->aplicarFiltroDataFrequencia($queryFreq, $trimestre);

            $totalAulas = (int) (clone $queryFreq)->sum('quantidade_aulas');
            $totalFaltas = (int) (clone $queryFreq)->where('status_presenca', 'Falta')->sum('quantidade_aulas');

            // Quando as faltas são sincronizadas via diário escolar consolidado CSV (sem chamadas diárias avulsas),
            // projeta o total de aulas do trimestre com base na carga horária anual da matéria para calcular a presença real
            if ($totalFaltas > 0 && $totalAulas <= $totalFaltas) {
                $aulasPrevistasTrimestre = max(20, (int) round(($disciplina->carga_horaria_anual ?: 80) / 3));
                $totalAulas = max($totalFaltas, $aulasPrevistasTrimestre);
            }

            // Determinação do status semântico
            $status = 'Aprovado';
            if ($totalAulas > 0 && ($totalFaltas / $totalAulas) > 0.25) {
                $status = 'Risco de Reprovação por Falta';
            } elseif ($valorMaximo > 0 ? (($notaObtida / $valorMaximo) < 0.6) : ($notaObtida < 6.0)) {
                $status = 'Abaixo da Média';
            }

            $cor = $paletaCores[$index % count($paletaCores)];

            $item = [
                'disciplina_id' => $disciplina->id_disciplina,
                'nome_disciplina' => $disciplina->nome,
                'nota_obtida' => $notaObtida,
                'valor_maximo' => $valorMaximo,
                'somatorio_faltas' => $totalFaltas,
                'total_aulas' => $totalAulas,
                'status' => $status,
                // Chaves de compatibilidade para o componente gráfico do front-end
                'id' => $disciplina->id_disciplina,
                'materia' => $disciplina->nome,
                'pontos' => $notaObtida,
                'cor' => $cor,
            ];

            $boletim[] = $item;
            $graficoBoletim[] = [
                'id' => $disciplina->id_disciplina,
                'materia' => $disciplina->nome,
                'pontos' => $notaObtida,
                'cor' => $cor,
            ];
        }

        return [
            'turma_id' => (int) $turmaId,
            'aluno_id' => (int) $alunoId,
            'periodo_selecionado' => $trimestre ? "{$trimestre}º Trimestre" : 'Consolidado Anual',
            'boletim' => $boletim,
            'grafico_boletim' => $graficoBoletim,
        ];
    }

    /**
     * Retorna o comparativo entre o desempenho individual do aluno e a média da turma.
     * Alimenta o Gráfico de Radar (Teia) pareando por disciplina:
     * - nota_aluno
     * - faltas_aluno
     * - media_turma
     * - media_faltas_turma
     */
    public function obterComparativoAlunoVsTurma(int|string $alunoId, int|string $turmaId, ?string $trimestre = null): array
    {
        $turma = Turma::findOrFail($turmaId);
        $disciplinas = $this->obterDisciplinasDaTurma($turma);

        $alunosAtivosIds = Matricula::where('turma_id', $turmaId)
            ->where('status_matricula', 'Ativo')
            ->pluck('usuario_id')
            ->all();

        $totalAlunosMatriculados = max(1, count($alunosAtivosIds));

        // Consulta agregada de frequência para todos os alunos ativos da turma
        $queryFreqGeral = Frequencia::where('turma_id', $turmaId)
            ->whereIn('usuario_id', $alunosAtivosIds);
        $this->aplicarFiltroDataFrequencia($queryFreqGeral, $trimestre);

        // Agrupado por disciplina_id e usuario_id
        $dadosFreqAgrupados = $queryFreqGeral
            ->selectRaw('disciplina_id, usuario_id, sum(quantidade_aulas) as total_aulas, sum(case when status_presenca = "Falta" then quantidade_aulas else 0 end) as total_faltas')
            ->groupBy('disciplina_id', 'usuario_id')
            ->get()
            ->groupBy('disciplina_id');

        $comparativo = [];
        $labels = [];
        $notasAluno = [];
        $faltasAluno = [];
        $mediasTurma = [];
        $mediasFaltasTurma = [];

        foreach ($disciplinas as $disciplina) {
            // 1. Desempenho individual de notas do aluno
            $queryNotaAluno = Nota::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);
            $this->aplicarFiltroPeriodo($queryNotaAluno, $trimestre);
            $notaAluno = $queryNotaAluno->avg('valor_nota');
            $notaAlunoNum = $notaAluno !== null ? round((float) $notaAluno, 2) : 0.0;

            // 2. Desempenho coletivo de notas da turma
            $queryNotaTurma = Nota::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina);
            $this->aplicarFiltroPeriodo($queryNotaTurma, $trimestre);
            $mediaTurma = $queryNotaTurma->avg('valor_nota');
            $mediaTurmaNum = $mediaTurma !== null ? round((float) $mediaTurma, 2) : 0.0;

            // 3. Faltas e Frequência percentual (Decisão Pedagógica: média simples dos alunos ativos)
            $freqAlunosDisc = $dadosFreqAgrupados->get($disciplina->id_disciplina, collect());
            $regAlunoEspecifico = $freqAlunosDisc->firstWhere('usuario_id', (int) $alunoId);

            $faltasAlunoNum = $regAlunoEspecifico ? (int) $regAlunoEspecifico->total_faltas : 0;
            $totalFaltasTurma = (int) $freqAlunosDisc->sum('total_faltas');
            $mediaFaltasTurmaNum = round($totalFaltasTurma / $totalAlunosMatriculados, 2);

            $frequenciaAluno = null;
            $frequenciaTurma = null;

            if ($freqAlunosDisc->isNotEmpty()) {
                $percentuaisIndividuais = [];

                foreach ($freqAlunosDisc as $reg) {
                    $aulas = (int) $reg->total_aulas;
                    $faltas = (int) $reg->total_faltas;

                    // Ajuste de projeção de aulas caso apenas faltas tenham sido sincronizadas via CSV
                    if ($faltas > 0 && $aulas <= $faltas) {
                        $aulasPrevistas = max(20, (int) round(($disciplina->carga_horaria_anual ?: 80) / ($trimestre ? 3 : 1)));
                        $aulas = max($faltas, $aulasPrevistas);
                    }

                    $pct = $aulas > 0 ? max(0.0, min(100.0, (($aulas - $faltas) / $aulas) * 100)) : 100.0;
                    $percentuaisIndividuais[] = $pct;

                    if ((int) $reg->usuario_id === (int) $alunoId) {
                        $frequenciaAluno = round($pct, 1);
                    }
                }

                if (! empty($percentuaisIndividuais)) {
                    $frequenciaTurma = round(array_sum($percentuaisIndividuais) / count($percentuaisIndividuais), 1);
                }
            }

            $item = [
                'disciplina_id' => $disciplina->id_disciplina,
                'nome_disciplina' => $disciplina->nome,
                'nota_aluno' => $notaAlunoNum,
                'faltas_aluno' => $faltasAlunoNum,
                'frequencia_aluno' => $frequenciaAluno,
                'media_turma' => $mediaTurmaNum,
                'media_faltas_turma' => $mediaFaltasTurmaNum,
                'frequencia_turma' => $frequenciaTurma,
                'valor_maximo' => $this->obterValorMaximoPeriodo($trimestre),
            ];

            $comparativo[] = $item;

            // Arrays para alimentar diretamente bibliotecas de gráficos Radar
            $labels[] = $disciplina->nome;
            $notasAluno[] = $notaAlunoNum;
            $faltasAluno[] = $faltasAlunoNum;
            $mediasTurma[] = $mediaTurmaNum;
            $mediasFaltasTurma[] = $mediaFaltasTurmaNum;
        }

        // 4. Frequência Global (Geral da Turma e do Aluno)
        $frequenciaTurmaGlobal = null;
        $frequenciaAlunoGlobal = null;

        if ($dadosFreqAgrupados->isNotEmpty()) {
            $alunosGlobais = $dadosFreqAgrupados->flatten(1)->groupBy('usuario_id');
            $percentuaisGlobaisAlunos = [];

            foreach ($alunosGlobais as $idUsuario => $registrosDoAluno) {
                $aulasTotal = (int) $registrosDoAluno->sum('total_aulas');
                $faltasTotal = (int) $registrosDoAluno->sum('total_faltas');

                if ($faltasTotal > 0 && $aulasTotal <= $faltasTotal) {
                    $aulasTotal = max($faltasTotal, 100);
                }

                $pctGlobal = $aulasTotal > 0 ? max(0.0, min(100.0, (($aulasTotal - $faltasTotal) / $aulasTotal) * 100)) : 100.0;
                $percentuaisGlobaisAlunos[] = $pctGlobal;

                if ((int) $idUsuario === (int) $alunoId) {
                    $frequenciaAlunoGlobal = round($pctGlobal, 1);
                }
            }

            if (! empty($percentuaisGlobaisAlunos)) {
                $frequenciaTurmaGlobal = round(array_sum($percentuaisGlobaisAlunos) / count($percentuaisGlobaisAlunos), 1);
            }
        }

        return [
            'turma_id' => (int) $turmaId,
            'aluno_id' => (int) $alunoId,
            'periodo_selecionado' => $trimestre ? "{$trimestre}º Trimestre" : 'Consolidado Anual',
            'frequencia_aluno_global' => $frequenciaAlunoGlobal,
            'frequencia_turma_global' => $frequenciaTurmaGlobal,
            'comparativo' => $comparativo,
            'radar' => [
                'labels' => $labels,
                'series' => [
                    [
                        'name' => 'Aluno',
                        'data' => $notasAluno,
                        'faltas' => $faltasAluno,
                    ],
                    [
                        'name' => 'Média da Turma',
                        'data' => $mediasTurma,
                        'faltas' => $mediasFaltasTurma,
                    ],
                ],
            ],
        ];
    }

    /**
     * Avalia a nota individual do aluno em uma disciplina específica,
     * calculando a diferença para a média escolar (meta: 6.0)
     * e indicando se está aprovado ou quantos pontos faltam para a aprovação.
     */
    public function avaliarNotaIndividualPorComponente(
        int|string $alunoId,
        int|string $turmaId,
        int|string $disciplinaId,
        ?string $trimestre = null
    ): array {
        $disciplina = Disciplina::findOrFail($disciplinaId);

        $query = Nota::where('turma_id', $turmaId)
            ->where('disciplina_id', $disciplinaId)
            ->where('usuario_id', $alunoId);

        $this->aplicarFiltroPeriodo($query, $trimestre);

        $media = $query->avg('valor_nota');
        $notaAtual = $media !== null ? round((float) $media, 2) : 0.0;
        $valorMaximo = (float) ($query->max('valor_maximo') ?: 10.0);

        $mediaEscolar = 6.0;
        $aprovado = $notaAtual >= $mediaEscolar;

        if ($aprovado) {
            $diferenca = round($notaAtual - $mediaEscolar, 2);
            $pontosFaltantes = 0.0;
            $mensagem = "Aprovado (+{$diferenca} pontos acima da média de aprovação)";
        } else {
            $diferenca = round($mediaEscolar - $notaAtual, 2);
            $pontosFaltantes = $diferenca;
            $mensagem = "Faltam {$diferenca} pontos para atingir a aprovação";
        }

        return [
            'disciplina_id' => $disciplina->id_disciplina,
            'nome_disciplina' => $disciplina->nome,
            'nota_atual' => $notaAtual,
            'valor_maximo' => $valorMaximo,
            'media_escolar_aprovacao' => $mediaEscolar,
            'aprovado' => $aprovado,
            'pontos_faltantes' => $pontosFaltantes,
            'diferenca' => $diferenca,
            'mensagem' => $mensagem,
        ];
    }

    /**
     * Avalia as faltas do aluno exclusivamente na disciplina,
     * cruzando com a carga horária anual e retornando o percentual isolado
     * e o saldo de faltas permitidas antes da reprovação (limite LDB: 25%).
     */
    public function avaliarFrequenciaIndividualPorComponente(
        int|string $alunoId,
        int|string $turmaId,
        int|string $disciplinaId,
        ?string $trimestre = null
    ): array {
        $disciplina = Disciplina::findOrFail($disciplinaId);
        $cargaHorariaPrevista = (int) ($disciplina->carga_horaria_anual ?: 80);

        $query = Frequencia::where('turma_id', $turmaId)
            ->where('disciplina_id', $disciplinaId)
            ->where('usuario_id', $alunoId);

        $this->aplicarFiltroDataFrequencia($query, $trimestre);

        $totalAulasRegistradas = (int) (clone $query)->sum('quantidade_aulas');
        $faltasAluno = (int) (clone $query)->where('status_presenca', 'Falta')->sum('quantidade_aulas');

        // Limite legal de faltas: 25% da carga horária
        $maximoFaltasPermitidas = (int) floor($cargaHorariaPrevista * 0.25);
        $percentualFaltas = $cargaHorariaPrevista > 0 ? round(($faltasAluno / $cargaHorariaPrevista) * 100, 2) : 0.0;
        $saldoFaltasPermitidas = max(0, $maximoFaltasPermitidas - $faltasAluno);
        $reprovadoPorFalta = $faltasAluno > $maximoFaltasPermitidas;

        if ($reprovadoPorFalta) {
            $mensagem = "Limite de faltas ultrapassado ({$faltasAluno} faltas). Reprovado por infrequência.";
        } else {
            $mensagem = "Restam {$saldoFaltasPermitidas} faltas permitidas antes da reprovação.";
        }

        return [
            'disciplina_id' => $disciplina->id_disciplina,
            'nome_disciplina' => $disciplina->nome,
            'faltas_aluno' => $faltasAluno,
            'total_aulas_registradas' => $totalAulasRegistradas,
            'carga_horaria_prevista' => $cargaHorariaPrevista,
            'percentual_faltas' => $percentualFaltas,
            'maximo_faltas_permitidas' => $maximoFaltasPermitidas,
            'saldo_faltas_permitidas' => $saldoFaltasPermitidas,
            'reprovado_por_falta' => $reprovadoPorFalta,
            'mensagem' => $mensagem,
        ];
    }

    /**
     * Retorna a análise de desempenho completa e detalhada da disciplina consultada.
     */
    public function obterDesempenhoCompletoComponente(
        int|string $alunoId,
        int|string $turmaId,
        int|string $disciplinaId,
        ?string $trimestre = null
    ): array {
        $turma = Turma::findOrFail($turmaId);
        $disciplina = Disciplina::findOrFail($disciplinaId);

        $desempenhoNota = $this->avaliarNotaIndividualPorComponente($alunoId, $turmaId, $disciplinaId, $trimestre);
        $desempenhoFrequencia = $this->avaliarFrequenciaIndividualPorComponente($alunoId, $turmaId, $disciplinaId, $trimestre);

        return [
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'disciplina' => [
                'id_disciplina' => $disciplina->id_disciplina,
                'nome' => $disciplina->nome,
            ],
            'periodo_selecionado' => $trimestre ? "{$trimestre}º Trimestre" : 'Consolidado Anual',
            'avaliacao_nota' => $desempenhoNota,
            'avaliacao_frequencia' => $desempenhoFrequencia,
        ];
    }

    /**
     * Monta o formato exato esperado pelos cards superiores do Front-end (StudentStatCards).
     */
    protected function montarStudentStatsFrontend(User $aluno, Turma $turma, float $mediaGeral, float $frequenciaGlobal): array
    {
        // 1. Frequência geral
        $classificacaoFrequencia = 'Ótima';
        if ($frequenciaGlobal < 75.0) {
            $classificacaoFrequencia = 'Crítica';
        } elseif ($frequenciaGlobal < 85.0) {
            $classificacaoFrequencia = 'Regular';
        } elseif ($frequenciaGlobal < 95.0) {
            $classificacaoFrequencia = 'Boa';
        }

        // 2. Média de notas proporcional à pontuação da rede estadual de MG (aprovação em 60%)
        $notaCorte = $mediaGeral > 40.0 ? 60.0 : ($mediaGeral > 10.0 ? 18.0 : 6.0);
        $diffMedia = round($mediaGeral - $notaCorte, 1);
        $comparacaoMedia = $diffMedia >= 0
            ? "+{$diffMedia} acima da média"
            : "{$diffMedia} abaixo da média";

        // 3. Leitura atual do aluno (módulo de biblioteca — filtra apenas empréstimos ativos/solicitados via Enum)
        $ultimoEmprestimo = Emprestimo::where('usuario_id', $aluno->id)
            ->whereIn('status', [
                EmprestimoStatus::APROVADO->value,
                EmprestimoStatus::RENOVADO->value,
                EmprestimoStatus::ATRASADO->value,
                EmprestimoStatus::SOLICITADO->value,
            ])
            ->with('livro')
            ->latest('data_emprestimo')
            ->first();

        if ($ultimoEmprestimo && $ultimoEmprestimo->livro) {
            $livro = $ultimoEmprestimo->livro;
            $leituraAtual = [
                'livro' => $livro->titulo,
                'pagina' => 'Pág. 1',
                'autor' => $livro->autor,
                'genero' => $livro->genero,
                'editora' => $livro->editora,
                'dataLancamento' => $livro->data_publicacao?->format('Y-m-d') ?? '',
            ];
        } else {
            $leituraAtual = [
                'livro' => 'Nenhum livro retirado',
                'pagina' => 'Pág. 0',
                'autor' => 'Biblioteca Escolar',
                'genero' => 'Literatura',
                'editora' => 'EEPSAS',
                'dataLancamento' => '',
            ];
        }

        // 4. Próxima notificação (próximo evento ou data pedagógica da agenda escolar)
        $proximoEvento = Evento::where('data_inicio', '>=', Carbon::now()->format('Y-m-d'))
            ->orderBy('data_inicio')
            ->first();

        if ($proximoEvento) {
            $tempoRestante = Carbon::parse($proximoEvento->data_inicio)->diffForHumans();
            $proximaNotificacao = [
                'titulo' => $proximoEvento->titulo,
                'tempoRestante' => 'Em '.$tempoRestante,
            ];
        } else {
            $proximaNotificacao = [
                'titulo' => 'Sem notificações urgentes',
                'tempoRestante' => 'Tudo em dia',
            ];
        }

        return [
            'frequenciaGeral' => [
                'porcentagem' => (int) round($frequenciaGlobal),
                'classificacao' => $classificacaoFrequencia,
            ],
            'mediaNotas' => [
                'valor' => number_format($mediaGeral, 1, '.', ''),
                'comparacao' => $comparacaoMedia,
            ],
            'leituraAtual' => $leituraAtual,
            'proximaNotificacao' => $proximaNotificacao,
        ];
    }

    /**
     * Obtém a lista de disciplinas vinculadas à turma ou com lançamentos.
     */
    protected function obterDisciplinasDaTurma(Turma $turma): array
    {
        // Garante a herança das disciplinas do Ciclo Escolar da turma
        $turma->herdarDisciplinasDoCiclo();

        $disciplinasDaTurmaIds = $turma->disciplinas()->pluck('disciplinas.id_disciplina')->toArray();
        $disciplinasComNotasIds = Nota::where('turma_id', $turma->id_turma)
            ->distinct()
            ->pluck('disciplina_id')
            ->toArray();

        $todosIds = array_values(array_unique(array_merge($disciplinasDaTurmaIds, $disciplinasComNotasIds)));

        if (empty($todosIds)) {
            return $turma->disciplinas()->get()->all();
        }

        return Disciplina::whereIn('id_disciplina', $todosIds)->orderBy('nome')->get()->all();
    }

    /**
     * Retorna o valor máximo oficial da avaliação de acordo com a divisão informada e o período letivo da turma.
     * Consulta dinamicamente a tabela periodo_letivo_divisoes com fallback padrão caso não haja período específico.
     */
    public function obterValorMaximoPeriodo(?string $trimestre, ?int $anoLetivo = null): float
    {
        if (empty($trimestre)) {
            if ($anoLetivo) {
                $total = PeriodoLetivo::where('ano', $anoLetivo)->value('total_pontos');
                if ($total) {
                    return (float) $total;
                }
            }

            return 100.00;
        }

        // Tenta consultar dinamicamente a divisão cadastrada no período letivo
        $triNum = is_numeric($trimestre) ? (int) $trimestre : (int) filter_var($trimestre, FILTER_SANITIZE_NUMBER_INT);

        $queryDiv = PeriodoLetivoDivisao::query();
        if ($anoLetivo) {
            $queryDiv->whereHas('periodoLetivo', fn ($q) => $q->where('ano', $anoLetivo));
        } else {
            $queryDiv->whereHas('periodoLetivo', fn ($q) => $q->where('ativo', true));
        }

        if ($triNum > 0) {
            $divisao = (clone $queryDiv)->where('numero', $triNum)->first();
            if ($divisao) {
                return (float) $divisao->pontos;
            }
        }

        $divisaoNome = $queryDiv->where('nome', 'like', "%{$trimestre}%")->first();
        if ($divisaoNome) {
            return (float) $divisaoNome->pontos;
        }

        $trimestreNorm = Str::ascii(Str::lower(trim($trimestre)));

        if ($trimestreNorm === '1' || str_contains($trimestreNorm, '1º') || str_contains($trimestreNorm, '1')) {
            return 30.00;
        }
        if ($trimestreNorm === '2' || str_contains($trimestreNorm, '2º') || str_contains($trimestreNorm, '2')) {
            return 30.00;
        }
        if ($trimestreNorm === '3' || str_contains($trimestreNorm, '3º') || str_contains($trimestreNorm, '3')) {
            return 40.00;
        }

        return 30.00;
    }

    /**
     * Aplica filtro temporal flexível por trimestre ou período letivo nas notas.
     *
     * @param  Builder|\Illuminate\Database\Query\Builder  $query
     */
    protected function aplicarFiltroPeriodo($query, ?string $periodo): void
    {
        if (empty($periodo)) {
            return;
        }

        if (is_numeric($periodo)) {
            $query->where('periodo_letivo', 'like', "{$periodo}º%");
        } else {
            $query->where('periodo_letivo', $periodo);
        }
    }

    /**
     * Aplica filtro temporal flexível por trimestre nas frequências baseando-se na data_aula
     * ou nos intervalos oficiais cadastrados no período letivo.
     *
     * @param  Builder|\Illuminate\Database\Query\Builder  $query
     */
    protected function aplicarFiltroDataFrequencia($query, ?string $trimestre, ?int $anoLetivo = null): void
    {
        if (empty($trimestre) || ! is_numeric($trimestre)) {
            return;
        }

        $triNum = (int) $trimestre;

        // Se houver divisão cadastrada com intervalo de datas no período letivo, utiliza as datas oficiais
        $queryDiv = PeriodoLetivoDivisao::query()->where('numero', $triNum);
        if ($anoLetivo) {
            $queryDiv->whereHas('periodoLetivo', fn ($q) => $q->where('ano', $anoLetivo));
        } else {
            $queryDiv->whereHas('periodoLetivo', fn ($q) => $q->where('ativo', true));
        }
        $divisao = $queryDiv->first();

        if ($divisao && $divisao->data_inicio && $divisao->data_fim) {
            $query->whereBetween('data_aula', [$divisao->data_inicio, $divisao->data_fim]);

            return;
        }

        // Fallback para calendário trimestral padrão
        match ($triNum) {
            1 => $query->whereMonth('data_aula', '<=', 4),
            2 => $query->whereMonth('data_aula', '>=', 5)->whereMonth('data_aula', '<=', 8),
            3 => $query->whereMonth('data_aula', '>=', 9),
            default => null,
        };
    }
}
