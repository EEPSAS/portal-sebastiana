<?php

namespace App\Services;

use App\Models\Atividade;
use App\Models\Disciplina;
use App\Models\Emprestimo;
use App\Models\Evento;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

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
            $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: 10.0);

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
            $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: 10.0);

            $queryFreq = Frequencia::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);

            $this->aplicarFiltroDataFrequencia($queryFreq, $trimestre);

            $totalAulas = (int) (clone $queryFreq)->sum('quantidade_aulas');
            $totalFaltas = (int) (clone $queryFreq)->where('status_presenca', 'Falta')->sum('quantidade_aulas');

            // Determinação do status semântico
            $status = 'Aprovado';
            if ($totalAulas > 0 && ($totalFaltas / $totalAulas) > 0.25) {
                $status = 'Risco de Reprovação por Falta';
            } elseif ($notaObtida < 6.0) {
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

        $totalAlunosMatriculados = max(1, Matricula::where('turma_id', $turmaId)->where('status_matricula', 'Ativo')->count());

        $comparativo = [];
        $labels = [];
        $notasAluno = [];
        $faltasAluno = [];
        $mediasTurma = [];
        $mediasFaltasTurma = [];

        foreach ($disciplinas as $disciplina) {
            // 1. Desempenho individual do aluno
            $queryNotaAluno = Nota::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);
            $this->aplicarFiltroPeriodo($queryNotaAluno, $trimestre);
            $notaAluno = $queryNotaAluno->avg('valor_nota');
            $notaAlunoNum = $notaAluno !== null ? round((float) $notaAluno, 2) : 0.0;

            $queryFreqAluno = Frequencia::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $alunoId);
            $this->aplicarFiltroDataFrequencia($queryFreqAluno, $trimestre);
            $faltasAlunoNum = (int) $queryFreqAluno->where('status_presenca', 'Falta')->sum('quantidade_aulas');

            // 2. Desempenho coletivo da turma
            $queryNotaTurma = Nota::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina);
            $this->aplicarFiltroPeriodo($queryNotaTurma, $trimestre);
            $mediaTurma = $queryNotaTurma->avg('valor_nota');
            $mediaTurmaNum = $mediaTurma !== null ? round((float) $mediaTurma, 2) : 0.0;

            $queryFreqTurma = Frequencia::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplina->id_disciplina);
            $this->aplicarFiltroDataFrequencia($queryFreqTurma, $trimestre);
            $totalFaltasTurma = (int) $queryFreqTurma->where('status_presenca', 'Falta')->sum('quantidade_aulas');
            $mediaFaltasTurmaNum = round($totalFaltasTurma / $totalAlunosMatriculados, 2);

            $item = [
                'disciplina_id' => $disciplina->id_disciplina,
                'nome_disciplina' => $disciplina->nome,
                'nota_aluno' => $notaAlunoNum,
                'faltas_aluno' => $faltasAlunoNum,
                'media_turma' => $mediaTurmaNum,
                'media_faltas_turma' => $mediaFaltasTurmaNum,
            ];

            $comparativo[] = $item;

            // Arrays para alimentar diretamente bibliotecas de gráficos Radar
            $labels[] = $disciplina->nome;
            $notasAluno[] = $notaAlunoNum;
            $faltasAluno[] = $faltasAlunoNum;
            $mediasTurma[] = $mediaTurmaNum;
            $mediasFaltasTurma[] = $mediaFaltasTurmaNum;
        }

        return [
            'turma_id' => (int) $turmaId,
            'aluno_id' => (int) $alunoId,
            'periodo_selecionado' => $trimestre ? "{$trimestre}º Trimestre" : 'Consolidado Anual',
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

        // 2. Média de notas
        $diffMedia = round($mediaGeral - 6.0, 1);
        $comparacaoMedia = $diffMedia >= 0
            ? "+{$diffMedia} acima da média"
            : "{$diffMedia} abaixo da média";

        // 3. Leitura atual do aluno (módulo de biblioteca)
        $ultimoEmprestimo = Emprestimo::where('usuario_id', $aluno->id)
            ->whereIn('status', ['Ativo', 'Pendente', 'Emprestado'])
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

        // 4. Próxima notificação (próxima atividade com prazo ou evento)
        $proximaAtividade = Atividade::where('turma_id', $turma->id_turma)
            ->where('status_atividade', 'Aberta')
            ->where(function ($q) {
                $q->whereNull('data_limite_entrega')
                    ->orWhere('data_limite_entrega', '>=', Carbon::now());
            })
            ->orderBy('data_limite_entrega')
            ->first();

        $proximoEvento = Evento::where('data_inicio', '>=', Carbon::now()->format('Y-m-d'))
            ->orderBy('data_inicio')
            ->first();

        if ($proximaAtividade) {
            $tempoRestante = $proximaAtividade->data_limite_entrega
                ? 'Entrega em '.$proximaAtividade->data_limite_entrega->diffForHumans()
                : 'Atividade Aberta';

            $proximaNotificacao = [
                'titulo' => $proximaAtividade->titulo,
                'tempoRestante' => $tempoRestante,
            ];
        } elseif ($proximoEvento) {
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
        $disciplinasIds = Nota::where('turma_id', $turma->id_turma)
            ->distinct()
            ->pluck('disciplina_id')
            ->toArray();

        if (empty($disciplinasIds)) {
            return $turma->disciplinas()->get()->all();
        }

        return Disciplina::whereIn('id_disciplina', $disciplinasIds)->get()->all();
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
     * Aplica filtro temporal flexível por trimestre nas frequências baseando-se na data_aula.
     *
     * @param  Builder|\Illuminate\Database\Query\Builder  $query
     */
    protected function aplicarFiltroDataFrequencia($query, ?string $trimestre): void
    {
        if (empty($trimestre) || ! is_numeric($trimestre)) {
            return;
        }

        $triNum = (int) $trimestre;

        // Divisão por trimestres letivos do ano escolar
        match ($triNum) {
            1 => $query->whereMonth('data_aula', '<=', 4),
            2 => $query->whereMonth('data_aula', '>=', 5)->whereMonth('data_aula', '<=', 8),
            3 => $query->whereMonth('data_aula', '>=', 9),
            default => null,
        };
    }
}
