<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Service responsável por processar inteligência acadêmica e dados analíticos
 * para alimentar a visão gerencial do Dashboard do Especialista Pedagógico.
 */
class EspecialistaDashboardService
{
    /**
     * Processa uma planilha consolidada do diário escolar (formato padrão EEPSAS / DED MG),
     * detectando automaticamente metadados, cabeçalhos de disciplinas (inclusive em múltiplas linhas),
     * colunas de notas/faltas, e sincronizando no banco de dados.
     *
     * @param  Turma  $turma  Turma que receberá os lançamentos acadêmicos
     * @param  UploadedFile|string  $arquivo  Arquivo enviado via upload ou caminho em disco
     * @param  string|null  $periodoLetivo  Período dos lançamentos (ex: '1º Trimestre' ou '1º Bimestre')
     * @param  string|null  $dataAula  Data de referência para as faltas (formato Y-m-d)
     * @return array Resumo com quantidade de registros processados e alertas
     */
    public function processarPlanilhaConsolidada(
        Turma $turma,
        UploadedFile|string $arquivo,
        ?string $periodoLetivo = null,
        ?string $dataAula = null
    ): array {
        // Lê o conteúdo bruto do arquivo
        $conteudo = $arquivo instanceof UploadedFile
            ? file_get_contents($arquivo->getRealPath())
            : file_get_contents($arquivo);

        // Converte codificação caso o arquivo venha no padrão antigo Windows (ISO-8859-1)
        if (! mb_check_encoding($conteudo, 'UTF-8')) {
            $conteudo = mb_convert_encoding($conteudo, 'UTF-8', 'ISO-8859-1');
        }

        // Separa as linhas do arquivo de forma compatível com quebras Windows e Linux
        $linhas = preg_split('/\r\n|\r|\n/', trim($conteudo));

        // 1. Extração automática de metadados das linhas iniciais do diário escolar
        $periodoDetectado = null;
        $dataExtracaoDetectada = null;

        foreach ($linhas as $linhaTexto) {
            // Detecta a divisão/período (ex: "DIVISÃO: 1º TRIMESTRE")
            if (preg_match('/DIVIS[ÃA]O:\s*([^,\r\n]+)/iu', $linhaTexto, $mDiv)) {
                $periodoDetectado = trim($mDiv[1]);
            }
            // Detecta data e hora da extração (ex: "DATA E HORA DA EXTRAÇÃO: 08/10/2026 16:02")
            if (preg_match('/DATA E HORA DA EXTRA[ÇC][ÃA]O:\s*(\d{2})\/(\d{2})\/(\d{4})/iu', $linhaTexto, $mData)) {
                $dataExtracaoDetectada = "{$mData[3]}-{$mData[2]}-{$mData[1]}";
            }
        }

        // Utiliza o período e a data informados ou os valores detectados automaticamente
        $periodo = $periodoLetivo ?: ($periodoDetectado ?: '1º Trimestre');
        $data = $dataAula ?: ($dataExtracaoDetectada ?: now()->format('Y-m-d'));

        // Extrai os dados estruturados de notas e faltas por aluno
        $dadosExtraidos = $this->extrairNotasEFaltasPorAluno($linhas, $turma);

        // Efetua a gravação e upsert no banco de dados de maneira transacional
        $resultadoSincronizacao = $this->sincronizarRegistrosAcademicos(
            $turma,
            $dadosExtraidos['alunos_dados'],
            $periodo,
            $data
        );

        return [
            'linhas_lidas' => count($linhas),
            'periodo_aplicado' => $periodo,
            'data_referencia' => $data,
            'alunos_identificados' => count($dadosExtraidos['alunos_dados']),
            'notas_sincronizadas' => $resultadoSincronizacao['notas_sincronizadas'],
            'frequencias_sincronizadas' => $resultadoSincronizacao['frequencias_sincronizadas'],
            'alertas' => array_merge($dadosExtraidos['alertas'], $resultadoSincronizacao['alertas']),
        ];
    }

    /**
     * Faz a leitura das linhas do diário escolar da EEPSAS, suportando cabeçalhos de disciplinas
     * em múltiplas linhas (ex: "CONCEITOS AVANÇADOS EM ARQUITETURA DE" + "SISTEMAS") e sub-cabeçalhos
     * alternados de "1º TRIMESTRE" e "FALTAS".
     *
     * @param  array  $linhas  Linhas de texto do CSV
     * @param  Turma  $turma  Turma que está sendo processada
     * @return array Dados estruturados contendo 'alunos_dados' e 'alertas'
     */
    public function extrairNotasEFaltasPorAluno(array $linhas, Turma $turma): array
    {
        $alertas = [];
        $alunosDados = [];

        // 1. Detectar o delimitador predominante do arquivo (; ou , ou tab)
        $delimitador = ',';
        foreach ($linhas as $linha) {
            $virgulas = substr_count($linha, ',');
            $pontosEVirgulas = substr_count($linha, ';');
            if ($pontosEVirgulas > $virgulas && $pontosEVirgulas > 2) {
                $delimitador = ';';
                break;
            }
            if ($virgulas > 2) {
                $delimitador = ',';
                break;
            }
        }

        // 2. Localizar o índice da linha de cabeçalho principal que contém "ALUNO"
        $linhaCabecalhoIdx = null;
        $cabecalhos = [];

        foreach ($linhas as $idx => $linhaTexto) {
            $colunas = str_getcsv($linhaTexto, $delimitador);
            foreach ($colunas as $col) {
                $colNorm = Str::lower(Str::ascii(trim($col)));
                if (in_array($colNorm, ['aluno', 'estudante', 'nome', 'nome do aluno', 'matricula', 'id'])) {
                    $linhaCabecalhoIdx = $idx;
                    $cabecalhos = array_map(fn ($c) => trim($c), $colunas);
                    break 2;
                }
            }
        }

        if ($linhaCabecalhoIdx === null) {
            return [
                'alunos_dados' => [],
                'alertas' => ['Não foi possível identificar a linha de cabeçalho de alunos na planilha.'],
            ];
        }

        // Encontra o índice da coluna que identifica o aluno
        $indiceAluno = 0;
        foreach ($cabecalhos as $cIdx => $cNome) {
            $cNorm = Str::lower(Str::ascii($cNome));
            if (in_array($cNorm, ['aluno', 'estudante', 'nome', 'nome do aluno', 'matricula', 'id'])) {
                $indiceAluno = $cIdx;
                break;
            }
        }

        // 3. Verificar se há linhas subsequentes de sub-cabeçalho (FALTAS / TRIMESTRE) e junção de títulos multi-linhas
        $subCabecalhoIdx = null;
        $linhasContinuacaoTitulos = [];

        for ($j = $linhaCabecalhoIdx + 1; $j < min(count($linhas), $linhaCabecalhoIdx + 6); $j++) {
            $linhaAtualTexto = $linhas[$j];
            $colunasTeste = str_getcsv($linhaAtualTexto, $delimitador);
            $linhaNorm = Str::upper(implode(' ', $colunasTeste));

            if (str_contains($linhaNorm, 'FALTA') || str_contains($linhaNorm, 'TRIMESTRE') || str_contains($linhaNorm, 'BIMESTRE')) {
                $subCabecalhoIdx = $j;
                break;
            } else {
                $naoVazias = array_filter(array_map('trim', $colunasTeste));
                // Se possui poucas colunas preenchidas (ex: quebra de título como "SISTEMAS"), agrupa
                if (count($naoVazias) > 0 && count($naoVazias) <= 8) {
                    $linhasContinuacaoTitulos[] = $colunasTeste;
                } else {
                    break;
                }
            }
        }

        // Mescla quebras de títulos de disciplinas (ex: "CONCEITOS..." + "SISTEMAS")
        foreach ($linhasContinuacaoTitulos as $linhaCont) {
            foreach ($linhaCont as $colIdx => $textoAdicional) {
                $textoAdicional = trim($textoAdicional);
                if (! empty($textoAdicional)) {
                    $cabecalhos[$colIdx] = trim(($cabecalhos[$colIdx] ?? '').' '.$textoAdicional);
                }
            }
        }

        $mapaColunas = []; // [indice_coluna => ['tipo' => 'nota'|'falta', 'disciplina_id' => int, 'nome_disciplina' => string]]

        if ($subCabecalhoIdx !== null) {
            // Formato com sub-cabeçalho oficial DED MG (ex: Linha de Disciplinas e Linha de 1º TRIMESTRE / FALTAS)
            $subCabecalhos = str_getcsv($linhas[$subCabecalhoIdx], $delimitador);
            $disciplinaAtualNome = null;
            $maxCols = max(count($cabecalhos), count($subCabecalhos));

            for ($c = 0; $c < $maxCols; $c++) {
                if ($c === $indiceAluno) {
                    continue;
                }

                $nomeNaColuna = trim($cabecalhos[$c] ?? '');
                if (! empty($nomeNaColuna)) {
                    $disciplinaAtualNome = $nomeNaColuna;
                }

                if (empty($disciplinaAtualNome)) {
                    continue;
                }

                $subTexto = Str::upper(trim($subCabecalhos[$c] ?? ''));
                $isFalta = str_contains($subTexto, 'FALTA') || str_contains($subTexto, 'AUSENCIA');

                // Garante que a disciplina existe no banco e está vinculada à turma
                $disciplinaModel = Disciplina::firstOrCreate(
                    ['nome' => $disciplinaAtualNome],
                    ['carga_horaria_anual' => 80]
                );

                if (! $turma->disciplinas()->where('disciplinas.id_disciplina', $disciplinaModel->id_disciplina)->exists()) {
                    $turma->disciplinas()->syncWithoutDetaching([$disciplinaModel->id_disciplina]);
                }

                $mapaColunas[$c] = [
                    'tipo' => $isFalta ? 'falta' : 'nota',
                    'disciplina_id' => $disciplinaModel->id_disciplina,
                    'nome_disciplina' => $disciplinaModel->nome,
                ];
            }

            $primeiraLinhaAlunosIdx = $subCabecalhoIdx + 1;
        } else {
            // Formato tabular tradicional (uma única linha de cabeçalho)
            $todasDisciplinas = Disciplina::all();

            foreach ($cabecalhos as $colIdx => $nomeColuna) {
                if ($colIdx === $indiceAluno) {
                    continue;
                }

                $nomeNorm = Str::lower(Str::ascii($nomeColuna));
                $isFalta = str_contains($nomeNorm, 'falta') || str_contains($nomeNorm, 'ausencia');

                foreach ($todasDisciplinas as $disc) {
                    $discNorm = Str::lower(Str::ascii($disc->nome));
                    if (str_contains($nomeNorm, $discNorm) || str_contains($discNorm, $nomeNorm)) {
                        $mapaColunas[$colIdx] = [
                            'tipo' => $isFalta ? 'falta' : 'nota',
                            'disciplina_id' => $disc->id_disciplina,
                            'nome_disciplina' => $disc->nome,
                        ];
                        break;
                    }
                }
            }

            $primeiraLinhaAlunosIdx = $linhaCabecalhoIdx + 1;
        }

        // 4. Percorrer as linhas com os dados dos alunos
        for ($i = $primeiraLinhaAlunosIdx; $i < count($linhas); $i++) {
            $linhaTexto = trim($linhas[$i]);
            if (empty($linhaTexto)) {
                continue;
            }

            $colunas = str_getcsv($linhaTexto, $delimitador);
            $identificadorAluno = trim($colunas[$indiceAluno] ?? '');

            if (empty($identificadorAluno)) {
                continue;
            }

            // Localiza ou cadastra o aluno dinamicamente
            $slugNome = Str::slug($identificadorAluno);
            $emailGerado = "{$slugNome}.{$turma->id_turma}@aluno.mg.gov.br";

            // 1. Busca por nome exato, e-mail informado ou e-mail padrão já gerado para a turma
            $alunoEncontrado = User::where('name', $identificadorAluno)
                ->orWhere('email', $identificadorAluno)
                ->orWhere('email', $emailGerado)
                ->first();

            // 2. Busca aproximada pelo slug do e-mail (caso o estudante já exista no sistema)
            if (! $alunoEncontrado) {
                $alunoEncontrado = User::where('email', 'like', "{$slugNome}%")->first();
            }

            // 3. Busca insensível a maiúsculas e acentos em nível de aplicação (compatível com SQLite)
            if (! $alunoEncontrado) {
                $nomeNormalizado = Str::ascii(mb_strtolower($identificadorAluno));
                $alunoEncontrado = User::all()->first(function ($user) use ($nomeNormalizado) {
                    return Str::ascii(mb_strtolower($user->name)) === $nomeNormalizado;
                });
            }

            // 4. Se o aluno realmente não existir, cadastra no sistema garantindo e-mail único
            if (! $alunoEncontrado) {
                $emailFinal = $emailGerado;
                $contador = 1;
                while (User::where('email', $emailFinal)->exists()) {
                    $contador++;
                    $emailFinal = "{$slugNome}.{$turma->id_turma}.{$contador}@aluno.mg.gov.br";
                }

                $alunoEncontrado = User::create([
                    'name' => $identificadorAluno,
                    'email' => $emailFinal,
                    'password' => bcrypt('12345678'),
                    'role' => UserRole::PADRAO,
                    'ativo' => true,
                ]);
            }

            // Garante a matrícula ativa do aluno na turma
            Matricula::firstOrCreate(
                [
                    'turma_id' => $turma->id_turma,
                    'usuario_id' => $alunoEncontrado->id,
                ],
                [
                    'data_matricula' => now()->format('Y-m-d'),
                    'status_matricula' => 'Ativo',
                ]
            );

            $notasDoAluno = [];
            $faltasDoAluno = [];

            foreach ($mapaColunas as $colIdx => $infoColuna) {
                $valorBruto = trim($colunas[$colIdx] ?? '');
                if ($valorBruto === '' || $valorBruto === '-') {
                    continue;
                }

                $valorNumerico = (float) str_replace(',', '.', $valorBruto);

                if ($infoColuna['tipo'] === 'nota') {
                    $notasDoAluno[] = [
                        'disciplina_id' => $infoColuna['disciplina_id'],
                        'valor_nota' => $valorNumerico,
                    ];
                } else {
                    $faltasDoAluno[] = [
                        'disciplina_id' => $infoColuna['disciplina_id'],
                        'quantidade_faltas' => (int) $valorNumerico,
                    ];
                }
            }

            $alunosDados[] = [
                'usuario_id' => $alunoEncontrado->id,
                'nome_aluno' => $alunoEncontrado->name,
                'notas' => $notasDoAluno,
                'faltas' => $faltasDoAluno,
            ];
        }

        return [
            'alunos_dados' => $alunosDados,
            'alertas' => $alertas,
        ];
    }

    /**
     * Efetua a persistência transacional (upsert) dos registros de notas e faltas extraídos.
     * Ajusta automaticamente a escala de nota máxima (10.0, 30.0 ou 100.0) de acordo com os dados.
     */
    public function sincronizarRegistrosAcademicos(
        Turma $turma,
        array $dadosAlunos,
        string $periodoLetivo,
        string $dataAula
    ): array {
        $notasSincronizadas = 0;
        $frequenciasSincronizadas = 0;
        $alertas = [];

        // Descobre a maior nota informada para determinar a pontuação máxima do período
        $maiorNotaGeral = 0.0;
        foreach ($dadosAlunos as $alunoItem) {
            foreach ($alunoItem['notas'] as $notaItem) {
                if ($notaItem['valor_nota'] > $maiorNotaGeral) {
                    $maiorNotaGeral = $notaItem['valor_nota'];
                }
            }
        }

        // Se a maior nota for superior a 10 e até 35 (caso clássico de trimestre em MG), valor_maximo = 30.0
        $valorMaximoPadrao = 10.00;
        if ($maiorNotaGeral > 35) {
            $valorMaximoPadrao = 100.00;
        } elseif ($maiorNotaGeral > 10) {
            $valorMaximoPadrao = 30.00;
        }

        DB::transaction(function () use (
            $turma,
            $dadosAlunos,
            $periodoLetivo,
            $dataAula,
            $valorMaximoPadrao,
            &$notasSincronizadas,
            &$frequenciasSincronizadas
        ) {
            foreach ($dadosAlunos as $alunoItem) {
                $usuarioId = $alunoItem['usuario_id'];

                // 1. Sincroniza cada nota da planilha (Update or Create)
                foreach ($alunoItem['notas'] as $notaItem) {
                    Nota::updateOrCreate(
                        [
                            'turma_id' => $turma->id_turma,
                            'disciplina_id' => $notaItem['disciplina_id'],
                            'usuario_id' => $usuarioId,
                            'periodo_letivo' => $periodoLetivo,
                        ],
                        [
                            'tipo_avaliacao' => 'Diário Consolidado',
                            'valor_nota' => $notaItem['valor_nota'],
                            'valor_maximo' => $valorMaximoPadrao,
                            'data_registro' => $dataAula,
                            'observacoes' => 'Importado via diário escolar consolidado do Especialista',
                        ]
                    );
                    $notasSincronizadas++;
                }

                // 2. Sincroniza cada registro de faltas
                foreach ($alunoItem['faltas'] as $faltaItem) {
                    $qtdFaltas = $faltaItem['quantidade_faltas'];

                    Frequencia::updateOrCreate(
                        [
                            'turma_id' => $turma->id_turma,
                            'disciplina_id' => $faltaItem['disciplina_id'],
                            'usuario_id' => $usuarioId,
                            'data_aula' => $dataAula,
                        ],
                        [
                            'quantidade_aulas' => max(1, $qtdFaltas),
                            'status_presenca' => $qtdFaltas > 0 ? 'Falta' : 'Presente',
                            'justificativa' => $qtdFaltas > 0 ? 'Registro de faltas via diário escolar' : null,
                        ]
                    );
                    $frequenciasSincronizadas++;
                }
            }
        });

        return [
            'notas_sincronizadas' => $notasSincronizadas,
            'frequencias_sincronizadas' => $frequenciasSincronizadas,
            'alertas' => $alertas,
        ];
    }

    /**
     * Calcula a média aritmética geral das notas dos alunos da turma.
     */
    public function calcularMediaGeralTurma(Turma $turma, ?string $periodo = null): float
    {
        $query = Nota::where('turma_id', $turma->id_turma);

        $this->aplicarFiltroPeriodo($query, $periodo);

        $media = $query->avg('valor_nota');

        return $media !== null ? round((float) $media, 2) : 0.0;
    }

    /**
     * Calcula a taxa percentual de absenteísmo (faltas) da turma.
     */
    public function calcularTaxaAbsenteismoTurma(Turma $turma, ?string $periodo = null): float
    {
        $query = Frequencia::where('turma_id', $turma->id_turma);

        $totalAulas = (int) (clone $query)->sum('quantidade_aulas');
        if ($totalAulas === 0) {
            return 0.0;
        }

        $faltas = (int) (clone $query)
            ->whereIn('status_presenca', ['Falta', 'Falta Justificada'])
            ->sum('quantidade_aulas');

        return round(($faltas / $totalAulas) * 100, 2);
    }

    /**
     * Calcula a distribuição percentual e quantitativa dos alunos nas faixas de aproveitamento:
     * - Excelentes (Aproveitamento >= 80%)
     * - Na Média (60% <= Aproveitamento < 80%)
     * - Críticos (Aproveitamento < 60%)
     */
    public function calcularDistribuicaoDeNotas(Turma $turma, ?string $periodo = null): array
    {
        $alunos = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();

        $excelentes = 0;
        $naMedia = 0;
        $criticos = 0;
        $avaliados = 0;

        foreach ($alunos as $aluno) {
            $query = Nota::where('turma_id', $turma->id_turma)
                ->where('usuario_id', $aluno->id);

            $this->aplicarFiltroPeriodo($query, $periodo);

            $notas = $query->get();
            if ($notas->isEmpty()) {
                continue;
            }

            $avaliados++;

            // Calcula o percentual médio de aproveitamento do aluno relativo ao valor_maximo de cada avaliação
            $percentuais = $notas->map(function ($nota) {
                $maximo = $nota->valor_maximo > 0 ? $nota->valor_maximo : 10.0;

                return ($nota->valor_nota / $maximo) * 100;
            });

            $aproveitamentoMedio = $percentuais->avg();

            if ($aproveitamentoMedio >= 80.0) {
                $excelentes++;
            } elseif ($aproveitamentoMedio >= 60.0) {
                $naMedia++;
            } else {
                $criticos++;
            }
        }

        $total = max(1, $avaliados);

        return [
            'total_avaliados' => $avaliados,
            'excelentes' => [
                'quantidade' => $excelentes,
                'percentual' => round(($excelentes / $total) * 100, 1),
            ],
            'na_media' => [
                'quantidade' => $naMedia,
                'percentual' => round(($naMedia / $total) * 100, 1),
            ],
            'criticos' => [
                'quantidade' => $criticos,
                'percentual' => round(($criticos / $total) * 100, 1),
            ],
        ];
    }

    /**
     * Monta o resumo gerencial executivo com os principais KPIs da turma.
     */
    public function obterResumoGerencial(Turma $turma, ?string $periodo = null): array
    {
        $mediaGeral = $this->calcularMediaGeralTurma($turma, $periodo);
        $taxaAbsenteismo = $this->calcularTaxaAbsenteismoTurma($turma, $periodo);
        $taxaPresenca = round(max(0, 100 - $taxaAbsenteismo), 2);
        $distribuicao = $this->calcularDistribuicaoDeNotas($turma, $periodo);

        $totalAlunos = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->count();

        return [
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
                'ano_letivo' => $turma->ano_letivo,
                'turno' => $turma->turno,
                'total_alunos' => $totalAlunos,
            ],
            'periodo_selecionado' => $periodo ?: 'Geral',
            'kpis' => [
                'media_geral_turma' => $mediaGeral,
                'taxa_absenteismo' => $taxaAbsenteismo,
                'taxa_presenca' => $taxaPresenca,
                'total_alunos_ativos' => $totalAlunos,
                'total_alunos_avaliados' => $distribuicao['total_avaliados'],
            ],
            'distribuicao_desempenho' => $distribuicao,
        ];
    }

    /**
     * Retorna o ranking das disciplinas ordenadas da pior para a melhor média,
     * calculando o percentual de aproveitamento e o status semântico de alerta.
     */
    public function calcularDesempenhoPorComponente(Turma $turma, ?string $periodo = null): array
    {
        $disciplinasIds = Nota::where('turma_id', $turma->id_turma)
            ->distinct()
            ->pluck('disciplina_id')
            ->toArray();

        if (empty($disciplinasIds)) {
            $disciplinas = $turma->disciplinas()->get();
        } else {
            $disciplinas = Disciplina::whereIn('id_disciplina', $disciplinasIds)->get();
        }

        $desempenhoLista = [];

        foreach ($disciplinas as $disciplina) {
            $queryNotas = Nota::where('turma_id', $turma->id_turma)
                ->where('disciplina_id', $disciplina->id_disciplina);

            $this->aplicarFiltroPeriodo($queryNotas, $periodo);

            $media = $queryNotas->avg('valor_nota');
            $mediaNum = $media !== null ? round((float) $media, 2) : 0.0;
            $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: 10.0);
            $totalAvaliacoes = $queryNotas->count();

            // Aproveitamento percentual da turma nesta disciplina
            $percentualAproveitamento = $valorMaximo > 0 ? round(($mediaNum / $valorMaximo) * 100, 1) : 0.0;

            $totalFaltas = (int) Frequencia::where('turma_id', $turma->id_turma)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('status_presenca', 'Falta')
                ->sum('quantidade_aulas');

            $statusAlerta = 'estavel';
            if ($percentualAproveitamento < 60.0 && $totalAvaliacoes > 0) {
                $statusAlerta = 'critico';
            } elseif ($percentualAproveitamento < 70.0 && $totalAvaliacoes > 0) {
                $statusAlerta = 'atencao';
            }

            $desempenhoLista[] = [
                'disciplina_id' => $disciplina->id_disciplina,
                'nome' => $disciplina->nome,
                'carga_horaria_anual' => $disciplina->carga_horaria_anual,
                'media' => $mediaNum,
                'valor_maximo' => $valorMaximo,
                'percentual_aproveitamento' => $percentualAproveitamento,
                'total_avaliacoes' => $totalAvaliacoes,
                'total_faltas' => $totalFaltas,
                'status_alerta' => $statusAlerta,
            ];
        }

        usort($desempenhoLista, fn ($a, $b) => $a['media'] <=> $b['media']);

        return $desempenhoLista;
    }

    /**
     * Identifica e lista todos os alunos em situação de risco acadêmico global na turma.
     */
    public function listarAlunosCriticos(Turma $turma, ?string $periodo = null): array
    {
        $alunos = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();
        $alunosCriticos = [];

        foreach ($alunos as $aluno) {
            $queryNotas = Nota::where('turma_id', $turma->id_turma)
                ->where('usuario_id', $aluno->id);

            $this->aplicarFiltroPeriodo($queryNotas, $periodo);

            $notas = $queryNotas->with('disciplina:id_disciplina,nome')->get();
            $mediaGeral = $notas->count() > 0 ? round((float) $notas->avg('valor_nota'), 2) : null;

            $disciplinasAbaixo = [];
            $disciplinasAgrupadas = $notas->groupBy('disciplina_id');

            foreach ($disciplinasAgrupadas as $discId => $notasDisc) {
                $mediaDisc = round((float) $notasDisc->avg('valor_nota'), 2);
                $maximoDisc = (float) ($notasDisc->first()->valor_maximo ?: 10.0);
                $aproveitamento = $maximoDisc > 0 ? ($mediaDisc / $maximoDisc) * 100 : 0.0;

                // Considera crítico se aproveitamento for inferior a 60%
                if ($aproveitamento < 60.0) {
                    $disciplinasAbaixo[] = [
                        'disciplina_id' => $discId,
                        'nome' => $notasDisc->first()->disciplina->nome ?? 'Disciplina '.$discId,
                        'media' => $mediaDisc,
                        'valor_maximo' => $maximoDisc,
                        'aproveitamento' => round($aproveitamento, 1),
                    ];
                }
            }

            $queryFreq = Frequencia::where('turma_id', $turma->id_turma)
                ->where('usuario_id', $aluno->id);

            $totalAulas = (int) (clone $queryFreq)->sum('quantidade_aulas');
            $totalFaltas = (int) (clone $queryFreq)->where('status_presenca', 'Falta')->sum('quantidade_aulas');
            $taxaFaltas = $totalAulas > 0 ? round(($totalFaltas / $totalAulas) * 100, 1) : 0.0;

            // Critérios de alerta pedagógico
            $motivos = [];

            // Aproveitamento geral do aluno abaixo de 60%
            if ($notas->isNotEmpty()) {
                $aproveitamentoGeral = $notas->map(fn ($n) => ($n->valor_nota / max(1, $n->valor_maximo)) * 100)->avg();
                if ($aproveitamentoGeral < 60.0) {
                    $aproveitamentoFormatado = round($aproveitamentoGeral, 1);
                    $motivos[] = "Aproveitamento geral crítico ({$aproveitamentoFormatado}%)";
                }
            }

            if (count($disciplinasAbaixo) >= 2) {
                $motivos[] = count($disciplinasAbaixo).' disciplinas com nota abaixo de 60%';
            }

            if ($taxaFaltas > 25.0 || $totalFaltas >= 15) {
                $motivos[] = "Excesso de faltas acumuladas ({$totalFaltas} faltas, {$taxaFaltas}%)";
            }

            if (! empty($motivos)) {
                $nivelRisco = (count($motivos) >= 2 || count($disciplinasAbaixo) >= 3) ? 'Crítico' : 'Alto';

                $alunosCriticos[] = [
                    'aluno_id' => $aluno->id,
                    'nome' => $aluno->name,
                    'email' => $aluno->email,
                    'media_geral' => $mediaGeral,
                    'total_disciplinas_criticas' => count($disciplinasAbaixo),
                    'disciplinas_criticas' => $disciplinasAbaixo,
                    'total_aulas' => $totalAulas,
                    'total_faltas' => $totalFaltas,
                    'taxa_faltas' => $taxaFaltas,
                    'nivel_risco' => $nivelRisco,
                    'motivos_risco' => $motivos,
                ];
            }
        }

        usort($alunosCriticos, function ($a, $b) {
            $pesoA = ($a['nivel_risco'] === 'Crítico' ? 10 : 5) + $a['total_disciplinas_criticas'];
            $pesoB = ($b['nivel_risco'] === 'Crítico' ? 10 : 5) + $b['total_disciplinas_criticas'];

            return $pesoB <=> $pesoA;
        });

        return $alunosCriticos;
    }

    /**
     * Retorna estatísticas detalhadas da turma focadas em um único componente curricular.
     */
    public function detalharDesempenhoDaTurmaPorComponente(
        Turma $turma,
        Disciplina $disciplina,
        ?string $periodo = null
    ): array {
        $queryNotas = Nota::where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplina->id_disciplina);

        $this->aplicarFiltroPeriodo($queryNotas, $periodo);

        $mediaTurma = $queryNotas->avg('valor_nota');
        $maiorNota = $queryNotas->max('valor_nota');
        $menorNota = $queryNotas->min('valor_nota');
        $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: 10.0);
        $totalAvaliacoes = $queryNotas->count();

        $queryFreq = Frequencia::where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplina->id_disciplina);

        $totalAulas = (int) (clone $queryFreq)->sum('quantidade_aulas');
        $totalFaltas = (int) (clone $queryFreq)->where('status_presenca', 'Falta')->sum('quantidade_aulas');
        $taxaFaltas = $totalAulas > 0 ? round(($totalFaltas / $totalAulas) * 100, 2) : 0.0;
        $taxaPresenca = round(max(0, 100 - $taxaFaltas), 2);

        $notasIndividuais = (clone $queryNotas)->get();
        $faixas = [
            'excelentes' => $notasIndividuais->filter(fn ($n) => ($n->valor_nota / max(1, $n->valor_maximo)) >= 0.8)->count(),
            'na_media' => $notasIndividuais->filter(function ($n) {
                $ap = $n->valor_nota / max(1, $n->valor_maximo);

                return $ap >= 0.6 && $ap < 0.8;
            })->count(),
            'criticos' => $notasIndividuais->filter(fn ($n) => ($n->valor_nota / max(1, $n->valor_maximo)) < 0.6)->count(),
        ];

        return [
            'turma' => [
                'id_turma' => $turma->id_turma,
                'nome_identificador' => $turma->nome_identificador,
            ],
            'disciplina' => [
                'id_disciplina' => $disciplina->id_disciplina,
                'nome' => $disciplina->nome,
                'carga_horaria_anual' => $disciplina->carga_horaria_anual,
            ],
            'periodo_selecionado' => $periodo ?: 'Geral',
            'estatisticas' => [
                'media_turma' => $mediaTurma !== null ? round((float) $mediaTurma, 2) : 0.0,
                'maior_nota' => $maiorNota !== null ? round((float) $maiorNota, 2) : 0.0,
                'menor_nota' => $menorNota !== null ? round((float) $menorNota, 2) : 0.0,
                'valor_maximo' => $valorMaximo,
                'total_avaliacoes' => $totalAvaliacoes,
                'total_aulas_ministradas' => $totalAulas,
                'total_faltas_acumuladas' => $totalFaltas,
                'taxa_absenteismo' => $taxaFaltas,
                'taxa_presenca' => $taxaPresenca,
            ],
            'distribuicao_faixas' => $faixas,
        ];
    }

    /**
     * Lista os alunos que estão com nota vermelha ou excesso de faltas exclusivamente na disciplina.
     */
    public function listarAlunosEmRiscoNoComponente(
        Turma $turma,
        Disciplina $disciplina,
        ?string $periodo = null
    ): array {
        $alunos = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();
        $alunosEmRisco = [];

        foreach ($alunos as $aluno) {
            $queryNotas = Nota::where('turma_id', $turma->id_turma)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $aluno->id);

            $this->aplicarFiltroPeriodo($queryNotas, $periodo);

            $mediaDisciplina = $queryNotas->avg('valor_nota');
            $mediaNum = $mediaDisciplina !== null ? round((float) $mediaDisciplina, 2) : null;
            $valorMaximo = (float) ($queryNotas->max('valor_maximo') ?: 10.0);
            $aproveitamento = ($mediaNum !== null && $valorMaximo > 0) ? ($mediaNum / $valorMaximo) * 100 : null;

            $queryFreq = Frequencia::where('turma_id', $turma->id_turma)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->where('usuario_id', $aluno->id);

            $totalAulas = (int) (clone $queryFreq)->sum('quantidade_aulas');
            $totalFaltas = (int) (clone $queryFreq)->where('status_presenca', 'Falta')->sum('quantidade_aulas');
            $taxaFaltas = $totalAulas > 0 ? round(($totalFaltas / $totalAulas) * 100, 1) : 0.0;

            $temNotaBaixa = $aproveitamento !== null && $aproveitamento < 60.0;
            $temExcessoFaltas = $taxaFaltas > 20.0 || $totalFaltas >= 4;

            if ($temNotaBaixa || $temExcessoFaltas) {
                $motivos = [];
                if ($temNotaBaixa) {
                    $motivos[] = "Nota abaixo de 60% ({$mediaNum}/{$valorMaximo})";
                }
                if ($temExcessoFaltas) {
                    $motivos[] = "Total de {$totalFaltas} faltas acumuladas ({$taxaFaltas}%)";
                }

                $alunosEmRisco[] = [
                    'aluno_id' => $aluno->id,
                    'nome' => $aluno->name,
                    'email' => $aluno->email,
                    'media_disciplina' => $mediaNum,
                    'valor_maximo' => $valorMaximo,
                    'aproveitamento' => $aproveitamento !== null ? round($aproveitamento, 1) : null,
                    'total_aulas' => $totalAulas,
                    'total_faltas' => $totalFaltas,
                    'taxa_faltas' => $taxaFaltas,
                    'motivo_risco' => implode(' | ', $motivos),
                ];
            }
        }

        usort($alunosEmRisco, fn ($a, $b) => ($a['media_disciplina'] ?? 0) <=> ($b['media_disciplina'] ?? 0));

        return $alunosEmRisco;
    }

    /**
     * Helper para aplicar filtro flexível por período letivo.
     *
     * @param  Builder|\Illuminate\Database\Query\Builder  $query
     * @param  string|null  $periodo  Nome do período ou número do trimestre/bimestre
     */
    private function aplicarFiltroPeriodo($query, ?string $periodo): void
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
}
