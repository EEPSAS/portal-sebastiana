<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Noticia;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
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
     * @param  array  $mapeamentosManuais  Mapeamento de homônimos confirmados pelo Especialista [nome_csv => id_usuario|'novo']
     * @param  string|null  $decisaoDivergencias  Decisão do usuário para notas divergentes ('atualizar' ou 'manter')
     * @return array Resumo com quantidade de registros processados e alertas
     */
    public function processarPlanilhaConsolidada(
        Turma $turma,
        UploadedFile|string $arquivo,
        ?string $periodoLetivo = null,
        ?string $dataAula = null,
        array $mapeamentosManuais = [],
        ?string $decisaoDivergencias = null
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

        // Utiliza o período detectado ou informado
        $periodo = $periodoLetivo ?: ($periodoDetectado ?: '1º Trimestre');

        // Determina uma data de referência alinhada ao período caso não haja data explícita no arquivo ou formulário
        $anoAtual = (int) ($turma->ano_letivo ?: date('Y'));
        $dataPadraoPeriodo = match (true) {
            str_contains($periodo, '1º') => "{$anoAtual}-04-15",
            str_contains($periodo, '2º') => "{$anoAtual}-08-15",
            str_contains($periodo, '3º') => "{$anoAtual}-11-15",
            default => now()->format('Y-m-d'),
        };

        $data = $dataAula ?: ($dataExtracaoDetectada ?: $dataPadraoPeriodo);

        // Extrai os dados estruturados de notas e faltas por aluno com suporte a múltiplos períodos e desambiguação
        $dadosExtraidos = $this->extrairNotasEFaltasPorAluno($linhas, $turma, $mapeamentosManuais, $periodo);

        // Se houver estudantes com homônimos que ainda não foram confirmados pelo especialista,
        // interrompemos a persistência para solicitar a confirmação manual sem corromper o banco.
        if (! empty($dadosExtraidos['ambiguidades'])) {
            return [
                'status' => 'pendente_confirmacao',
                'tipo_pendencia' => 'homonimos',
                'message' => 'Identificamos alunos com o mesmo nome na turma. Por favor, confirme a correspondência de cada um.',
                'ambiguidades' => array_values($dadosExtraidos['ambiguidades']),
                'divergencias' => [],
                'linhas_lidas' => count($linhas),
                'alunos_identificados' => count($dadosExtraidos['alunos_dados']),
                'alunos_ignorados' => $dadosExtraidos['alunos_ignorados'] ?? [],
                'total_ignorados' => count($dadosExtraidos['alunos_ignorados'] ?? []),
                'notas_sincronizadas' => 0,
                'frequencias_sincronizadas' => 0,
                'alertas' => $dadosExtraidos['alertas'],
            ];
        }

        // Detecta possíveis divergências entre notas já cadastradas e novas notas do arquivo
        $divergencias = $this->detectarDivergenciasNotas($turma, $dadosExtraidos['alunos_dados']);

        // Caso haja divergências e o Especialista ainda não tenha tomado a decisão ('atualizar' ou 'manter'):
        if (! empty($divergencias) && empty($decisaoDivergencias)) {
            return [
                'status' => 'pendente_confirmacao',
                'tipo_pendencia' => 'divergencias_notas',
                'message' => 'Identificamos divergências entre as notas do arquivo e as notas já cadastradas para períodos anteriores. Por favor, confirme se deseja atualizar ou manter as notas anteriores.',
                'ambiguidades' => [],
                'divergencias' => $divergencias,
                'linhas_lidas' => count($linhas),
                'alunos_identificados' => count($dadosExtraidos['alunos_dados']),
                'alunos_ignorados' => $dadosExtraidos['alunos_ignorados'] ?? [],
                'total_ignorados' => count($dadosExtraidos['alunos_ignorados'] ?? []),
                'notas_sincronizadas' => 0,
                'frequencias_sincronizadas' => 0,
                'alertas' => $dadosExtraidos['alertas'],
            ];
        }

        // Efetua a gravação e upsert no banco de dados de maneira transacional
        $resultadoSincronizacao = $this->sincronizarRegistrosAcademicos(
            $turma,
            $dadosExtraidos['alunos_dados'],
            $periodo,
            $data,
            $decisaoDivergencias,
            $divergencias
        );

        $totalIgnorados = count($dadosExtraidos['alunos_ignorados'] ?? []);
        $totalIdentificados = count($dadosExtraidos['alunos_dados']);

        // Mensagem didática informando o sucesso da importação e o tratamento aplicado
        $mensagemSucesso = match ($decisaoDivergencias) {
            'atualizar' => "Relatório processado: {$totalIdentificados} aluno(s) sincronizado(s). As notas divergentes de períodos anteriores foram atualizadas com sucesso.",
            'manter' => "Relatório processado: {$totalIdentificados} aluno(s) sincronizado(s). As notas anteriores foram mantidas e apenas os novos períodos foram importados.",
            default => $totalIgnorados > 0
                ? "Relatório processado: {$totalIdentificados} aluno(s) sincronizado(s). {$totalIgnorados} aluno(s) ignorado(s) por falta de cadastro institucional (@aluno.mg.gov.br) ou matrícula ativa."
                : 'Relatório da turma importado e sincronizado com sucesso.',
        };

        return [
            'status' => 'sucesso',
            'message' => $mensagemSucesso,
            'linhas_lidas' => count($linhas),
            'periodo_aplicado' => $periodo,
            'data_referencia' => $data,
            'alunos_identificados' => $totalIdentificados,
            'alunos_ignorados' => $dadosExtraidos['alunos_ignorados'] ?? [],
            'total_ignorados' => $totalIgnorados,
            'notas_sincronizadas' => $resultadoSincronizacao['notas_sincronizadas'],
            'frequencias_sincronizadas' => $resultadoSincronizacao['frequencias_sincronizadas'],
            'alertas' => array_merge($dadosExtraidos['alertas'], $resultadoSincronizacao['alertas']),
        ];
    }

    /**
     * Normaliza e separa os termos significativos de um nome completo (removendo acentos e conectivos).
     *
     * @return array{primeiro: string, ultimo: string, termos: array<string>}
     */
    public function normalizarTermosNome(string $nomeCompleto): array
    {
        // Converte para minúsculas e remove acentos
        $limpo = Str::ascii(mb_strtolower(trim($nomeCompleto)));
        // Remove pontuações e caracteres que não sejam letras e espaços
        $limpo = preg_replace('/[^a-z0-9\s]/', '', $limpo);

        $palavras = array_values(array_filter(explode(' ', (string) $limpo)));

        // Preposições e conectivos comuns da língua portuguesa a serem desconsiderados
        $conectivos = ['de', 'da', 'do', 'das', 'dos', 'e'];
        $termos = array_values(array_filter($palavras, fn ($p) => ! in_array($p, $conectivos) && strlen($p) > 1));

        if (empty($termos)) {
            $termos = $palavras;
        }

        $primeiro = $termos[0] ?? '';
        $ultimo = $termos[count($termos) - 1] ?? $primeiro;

        return [
            'primeiro' => $primeiro,
            'ultimo' => $ultimo,
            'termos' => $termos,
        ];
    }

    /**
     * Localiza candidatos a aluno correspondentes ao identificador ou nome vindo do CSV.
     * Heurística:
     * 1. Correspondência exata por ID, e-mail ou nome civil.
     * 2. Padrão de e-mail institucional (primeiro.ultimo@...).
     * 3. Nome cadastrado contendo primeiro e último termo.
     * Prioriza os alunos já matriculados na turma atual; recorre aos demais alunos da escola se vazio.
     *
     * @return Collection<int, User>
     */
    public function buscarCandidatosAluno(string $identificadorAluno, Turma $turma): Collection
    {
        $identificadorLimpo = trim($identificadorAluno);
        $slugNome = Str::slug($identificadorLimpo);
        $nomeNormalizado = Str::ascii(mb_strtolower($identificadorLimpo));
        $infoTermos = $this->normalizarTermosNome($identificadorLimpo);
        $primeiro = $infoTermos['primeiro'];
        $ultimo = $infoTermos['ultimo'];

        $testarUsuario = function (User $usuario) use ($identificadorLimpo, $nomeNormalizado, $slugNome, $primeiro, $ultimo) {
            $userNameNorm = Str::ascii(mb_strtolower($usuario->name));
            $userEmailNorm = Str::ascii(mb_strtolower($usuario->email));

            // 1. Correspondência exata por nome ou e-mail
            if ($userNameNorm === $nomeNormalizado || $usuario->email === $identificadorLimpo || $usuario->name === $identificadorLimpo) {
                return true;
            }

            // 2. Slug exato no e-mail (ex: yasmin-teixeira-santos...)
            if (str_starts_with($userEmailNorm, "{$slugNome}@") || str_starts_with($userEmailNorm, "{$slugNome}.")) {
                return true;
            }

            // 3. Padrão institucional de primeiro e último nome no e-mail (ex: yasmin.santos@...)
            if (! empty($primeiro) && ! empty($ultimo)) {
                $padraoEmailPonto = "{$primeiro}.{$ultimo}@";
                $padraoEmailUnderline = "{$primeiro}_{$ultimo}@";
                $padraoEmailJunto = "{$primeiro}{$ultimo}@";

                if (str_starts_with($userEmailNorm, $padraoEmailPonto)
                    || str_starts_with($userEmailNorm, $padraoEmailUnderline)
                    || str_starts_with($userEmailNorm, $padraoEmailJunto)) {
                    return true;
                }

                // 4. Nome cadastrado no banco contendo primeiro e último termo
                $termosCadastrados = $this->normalizarTermosNome($usuario->name);
                if ($termosCadastrados['primeiro'] === $primeiro && $termosCadastrados['ultimo'] === $ultimo) {
                    return true;
                }
            }

            return false;
        };

        // 1ª Prioridade: Buscar entre os alunos ativos matriculados na turma
        $alunosDaTurma = $turma->alunos()->get();
        $candidatosNaTurma = $alunosDaTurma->filter($testarUsuario)->values();

        if ($candidatosNaTurma->isNotEmpty()) {
            return $candidatosNaTurma;
        }

        // 2ª Prioridade: Buscar entre todos os alunos cadastrados no sistema
        $todosAlunos = User::where('role', UserRole::ALUNO)->get();

        return $todosAlunos->filter($testarUsuario)->values();
    }

    /**
     * Normaliza a identificação do período letivo a partir do cabeçalho ou sub-cabeçalho da planilha.
     * Suporta trimestres (1º, 2º, 3º), bimestres (1º a 4º) e avaliações de recuperação (EIR).
     */
    public function normalizarPeriodoLetivo(string $texto, ?string $periodoFallback = null): ?string
    {
        $t = Str::upper(trim($texto));

        if (str_contains($t, '1º TRIM') || str_contains($t, '1 TRIM') || str_contains($t, '1ºTRIM')) {
            return '1º Trimestre';
        }
        if (str_contains($t, '2º TRIM') || str_contains($t, '2 TRIM') || str_contains($t, '2ºTRIM')) {
            return '2º Trimestre';
        }
        if (str_contains($t, '3º TRIM') || str_contains($t, '3 TRIM') || str_contains($t, '3ºTRIM')) {
            return '3º Trimestre';
        }
        if (str_contains($t, '1º BIM') || str_contains($t, '1 BIM') || str_contains($t, '1ºBIM')) {
            return '1º Bimestre';
        }
        if (str_contains($t, '2º BIM') || str_contains($t, '2 BIM') || str_contains($t, '2ºBIM')) {
            return '2º Bimestre';
        }
        if (str_contains($t, '3º BIM') || str_contains($t, '3 BIM') || str_contains($t, '3ºBIM')) {
            return '3º Bimestre';
        }
        if (str_contains($t, '4º BIM') || str_contains($t, '4 BIM') || str_contains($t, '4ºBIM')) {
            return '4º Bimestre';
        }
        if ($t === 'EIR' || str_contains($t, 'RECUPERA')) {
            return 'Recuperação (EIR)';
        }

        return $periodoFallback;
    }

    /**
     * Retorna o valor máximo oficial da avaliação de acordo com o período letivo (padrão SEE-MG / EEPSAS).
     * 1º Trimestre: 30 pts, 2º Trimestre: 30 pts, 3º Trimestre: 40 pts (Totalizando 100 pontos).
     */
    public function obterValorMaximoPeriodo(?string $periodo): float
    {
        if (! $periodo) {
            return 30.00;
        }

        $periodoNorm = Str::ascii(Str::lower(trim($periodo)));

        if (str_contains($periodoNorm, '1') && str_contains($periodoNorm, 'tri')) {
            return 30.00;
        }
        if (str_contains($periodoNorm, '2') && str_contains($periodoNorm, 'tri')) {
            return 30.00;
        }
        if (str_contains($periodoNorm, '3') && str_contains($periodoNorm, 'tri')) {
            return 40.00;
        }
        if (str_contains($periodoNorm, 'bim')) {
            return 25.00;
        }
        if (str_contains($periodoNorm, 'recupera') || str_contains($periodoNorm, 'eir') || str_contains($periodoNorm, 'final')) {
            return 100.00;
        }

        return 30.00;
    }

    /**
     * Faz a leitura das linhas do diário escolar da EEPSAS, suportando cabeçalhos de disciplinas
     * em múltiplas linhas e sub-cabeçalhos com trimestres alternados (1º, 2º, 3º TRIMESTRE, EIR, FALTAS).
     *
     * @param  array  $linhas  Linhas de texto do CSV
     * @param  Turma  $turma  Turma que está sendo processada
     * @param  array  $mapeamentosManuais  Mapeamentos de homônimos resolvidos pelo especialista [nome_csv => id_usuario|'novo']
     * @param  string|null  $periodoPadrao  Período padrão caso o arquivo não contenha sub-cabeçalhos de trimestres
     * @return array Dados estruturados contendo 'alunos_dados', 'ambiguidades' e 'alertas'
     */
    public function extrairNotasEFaltasPorAluno(
        array $linhas,
        Turma $turma,
        array $mapeamentosManuais = [],
        ?string $periodoPadrao = null
    ): array {
        $alertas = [];
        $alunosDados = [];
        $ambiguidades = [];
        $alunosIgnorados = [];

        // 1. Detectar o delimitador predominante do arquivo (; ou , ou tab)
        $delimitador = ',';
        $totalPontosEVirgulas = 0;
        $totalVirgulas = 0;
        foreach ($linhas as $linha) {
            $totalVirgulas += substr_count($linha, ',');
            $totalPontosEVirgulas += substr_count($linha, ';');
        }
        if ($totalPontosEVirgulas >= $totalVirgulas && $totalPontosEVirgulas > 0) {
            $delimitador = ';';
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
                } elseif (count($naoVazias) === 0) {
                    continue;
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

        $mapaColunas = []; // [indice_coluna => ['tipo' => 'nota'|'falta'|'ignorar', 'disciplina_id' => int, ...]]

        if ($subCabecalhoIdx !== null) {
            // Formato com sub-cabeçalho oficial DED MG (ex: Linha de Disciplinas e Linha de 1º TRIMESTRE / FALTAS)
            $subCabecalhos = str_getcsv($linhas[$subCabecalhoIdx], $delimitador);
            $disciplinaAtualNome = null;
            $maxCols = max(count($cabecalhos), count($subCabecalhos));

            // Carrega disciplinas existentes para busca resiliente insensível a maiúsculas e acentos
            $todasDisciplinas = Disciplina::all();

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

                // Desconsidera a coluna TOTAL, pois é um somatório de pontos calculado pela escola
                if ($subTexto === 'TOTAL' || str_contains($subTexto, 'TOTAL')) {
                    $mapaColunas[$c] = ['tipo' => 'ignorar'];

                    continue;
                }

                $isFalta = str_contains($subTexto, 'FALTA') || str_contains($subTexto, 'AUSENCIA');

                // Garante que a disciplina existe no banco (busca insensível a acentos/caixa) e está vinculada à turma
                $disciplinaModel = $todasDisciplinas->first(function (Disciplina $d) use ($disciplinaAtualNome) {
                    return Str::ascii(mb_strtolower($d->nome)) === Str::ascii(mb_strtolower($disciplinaAtualNome));
                });

                if (! $disciplinaModel) {
                    $disciplinaModel = Disciplina::create([
                        'nome' => $disciplinaAtualNome,
                        'carga_horaria_anual' => 80,
                    ]);
                    $todasDisciplinas->push($disciplinaModel);
                }

                if (! $turma->disciplinas()->where('disciplinas.id_disciplina', $disciplinaModel->id_disciplina)->exists()) {
                    $turma->disciplinas()->syncWithoutDetaching([$disciplinaModel->id_disciplina]);
                }

                $periodoDaColuna = $this->normalizarPeriodoLetivo($subTexto, $periodoPadrao ?: '1º Trimestre');
                $isRecuperacao = $subTexto === 'EIR' || str_contains($subTexto, 'RECUPERA');

                $mapaColunas[$c] = [
                    'tipo' => $isFalta ? 'falta' : 'nota',
                    'disciplina_id' => $disciplinaModel->id_disciplina,
                    'nome_disciplina' => $disciplinaModel->nome,
                    'periodo_letivo' => $periodoDaColuna,
                    'tipo_avaliacao' => $isRecuperacao ? 'Recuperação (EIR)' : 'Diário Consolidado',
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

                $nomeUpper = Str::upper(trim($nomeColuna));
                if ($nomeUpper === 'TOTAL' || str_contains($nomeUpper, 'TOTAL')) {
                    $mapaColunas[$colIdx] = ['tipo' => 'ignorar'];

                    continue;
                }

                $nomeNorm = Str::lower(Str::ascii($nomeColuna));
                $isFalta = str_contains($nomeNorm, 'falta') || str_contains($nomeNorm, 'ausencia');

                foreach ($todasDisciplinas as $disc) {
                    $discNorm = Str::lower(Str::ascii($disc->nome));
                    if (str_contains($nomeNorm, $discNorm) || str_contains($discNorm, $nomeNorm)) {
                        $periodoDaColuna = $this->normalizarPeriodoLetivo($nomeColuna, $periodoPadrao ?: '1º Trimestre');
                        $isRecuperacao = str_contains($nomeUpper, 'EIR') || str_contains($nomeUpper, 'RECUPERA');

                        $mapaColunas[$colIdx] = [
                            'tipo' => $isFalta ? 'falta' : 'nota',
                            'disciplina_id' => $disc->id_disciplina,
                            'nome_disciplina' => $disc->nome,
                            'periodo_letivo' => $periodoDaColuna,
                            'tipo_avaliacao' => $isRecuperacao ? 'Recuperação (EIR)' : 'Diário Consolidado',
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

            // Localiza ou cadastra o aluno dinamicamente através da heurística inteligente
            $alunoEncontrado = null;

            // 1. Caso o Especialista já tenha resolvido a ambiguidade manualmente pelo modal
            if (isset($mapeamentosManuais[$identificadorAluno])) {
                $opcaoEscolhida = $mapeamentosManuais[$identificadorAluno];
                if ($opcaoEscolhida !== 'novo' && $opcaoEscolhida !== 'criar_novo' && $opcaoEscolhida !== 'ignorar' && $opcaoEscolhida !== 'nenhum') {
                    $alunoEncontrado = User::find((int) $opcaoEscolhida);
                }
            } else {
                // 2. Heurística de correspondência resiliente (primeiro e último nome, e-mail institucional)
                $candidatos = $this->buscarCandidatosAluno($identificadorAluno, $turma);

                if ($candidatos->count() === 1) {
                    $alunoEncontrado = $candidatos->first();
                } elseif ($candidatos->count() > 1) {
                    // Detectada ambiguidade/homônimo: armazena para confirmação manual no modal
                    if (! isset($ambiguidades[$identificadorAluno])) {
                        $ambiguidades[$identificadorAluno] = [
                            'nome_csv' => $identificadorAluno,
                            'candidatos' => $candidatos->map(fn (User $u) => [
                                'id' => $u->id,
                                'name' => $u->name,
                                'email' => $u->email,
                                'ja_matriculado' => $turma->alunos()->where('users.id', $u->id)->exists(),
                            ])->values()->all(),
                        ];
                    }

                    continue; // Não processa as notas desta linha até que o Especialista confirme
                }
            }

            // 3. Regra de Negócio: Se o aluno não foi cadastrado no sistema, não gerar usuário nem notas
            if (! $alunoEncontrado) {
                $alertas[] = "Aluno '{$identificadorAluno}' ignorado: não está cadastrado no sistema com e-mail institucional (@aluno.mg.gov.br).";
                $alunosIgnorados[] = [
                    'nome_csv' => $identificadorAluno,
                    'motivo' => 'Não cadastrado no sistema',
                ];

                continue;
            }

            // 4. Regra de Negócio: Valida se o aluno possui e-mail institucional oficial (@aluno.mg.gov.br)
            if (! $alunoEncontrado->hasInstitutionalEmail()) {
                $alertas[] = "Aluno '{$identificadorAluno}' ignorado: usuário cadastrado ({$alunoEncontrado->email}) não possui e-mail institucional oficial (@aluno.mg.gov.br).";
                $alunosIgnorados[] = [
                    'nome_csv' => $identificadorAluno,
                    'email' => $alunoEncontrado->email,
                    'motivo' => 'E-mail não institucional',
                ];

                continue;
            }

            // 5. Regra de Negócio: O aluno deve possuir matrícula ativa prévia nesta turma
            $estaMatriculado = $turma->alunos()
                ->where('users.id', $alunoEncontrado->id)
                ->wherePivot('status_matricula', 'Ativo')
                ->exists();

            if (! $estaMatriculado) {
                $alertas[] = "Aluno '{$identificadorAluno}' ignorado: não possui matrícula ativa na turma '{$turma->nome_identificador}'.";
                $alunosIgnorados[] = [
                    'nome_csv' => $identificadorAluno,
                    'email' => $alunoEncontrado->email,
                    'motivo' => 'Sem matrícula ativa nesta turma',
                ];

                continue;
            }

            $notasDoAluno = [];
            $faltasDoAluno = [];

            foreach ($mapaColunas as $colIdx => $infoColuna) {
                if (($infoColuna['tipo'] ?? '') === 'ignorar') {
                    continue;
                }

                $valorBruto = trim($colunas[$colIdx] ?? '');
                if ($valorBruto === '' || $valorBruto === '-') {
                    continue;
                }

                $valorNumerico = (float) str_replace(',', '.', $valorBruto);

                if ($infoColuna['tipo'] === 'nota') {
                    $notasDoAluno[] = [
                        'disciplina_id' => $infoColuna['disciplina_id'],
                        'nome_disciplina' => $infoColuna['nome_disciplina'] ?? '',
                        'periodo_letivo' => $infoColuna['periodo_letivo'] ?? ($periodoPadrao ?: '1º Trimestre'),
                        'tipo_avaliacao' => $infoColuna['tipo_avaliacao'] ?? 'Diário Consolidado',
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
            'ambiguidades' => $ambiguidades,
            'alertas' => $alertas,
            'alunos_ignorados' => $alunosIgnorados,
        ];
    }

    /**
     * Compara as notas extraídas da planilha com as notas já registradas no banco de dados para a turma.
     * Identifica divergências quando uma nota de período já cadastrado difere da nota da planilha em mais de 0.01 ponto.
     *
     * @param  Turma  $turma  Turma que está sendo processada
     * @param  array  $alunosDados  Array de alunos com suas respectivas notas
     * @return array<int, array{usuario_id: int, nome_aluno: string, disciplina_id: int, nome_disciplina: string, periodo_letivo: string, nota_atual: float, nova_nota: float}>
     */
    public function detectarDivergenciasNotas(Turma $turma, array $alunosDados): array
    {
        $divergencias = [];

        // Carrega em cache as notas existentes da turma para verificação eficiente sem N+1
        $notasExistentes = Nota::with('disciplina')
            ->where('turma_id', $turma->id_turma)
            ->get()
            ->groupBy(fn (Nota $n) => "{$n->usuario_id}_{$n->disciplina_id}_{$n->periodo_letivo}");

        foreach ($alunosDados as $alunoItem) {
            $usuarioId = $alunoItem['usuario_id'];
            $nomeAluno = $alunoItem['nome_aluno'];

            foreach ($alunoItem['notas'] as $notaItem) {
                $disciplinaId = $notaItem['disciplina_id'];
                $periodoLetivo = $notaItem['periodo_letivo'];
                $novaNota = (float) $notaItem['valor_nota'];

                $chave = "{$usuarioId}_{$disciplinaId}_{$periodoLetivo}";
                $notaRegistrada = $notasExistentes->get($chave)?->first();

                if ($notaRegistrada !== null) {
                    $notaAtual = (float) $notaRegistrada->valor_nota;

                    // Se a nota cadastrada for diferente da nota da planilha (diferença > 0.01)
                    if (abs($notaAtual - $novaNota) > 0.01) {
                        $divergencias[] = [
                            'usuario_id' => $usuarioId,
                            'nome_aluno' => $nomeAluno,
                            'disciplina_id' => $disciplinaId,
                            'nome_disciplina' => $notaItem['nome_disciplina'] ?: ($notaRegistrada->disciplina?->nome ?? 'Disciplina'),
                            'periodo_letivo' => $periodoLetivo,
                            'nota_atual' => $notaAtual,
                            'nova_nota' => $novaNota,
                        ];
                    }
                }
            }
        }

        return $divergencias;
    }

    /**
     * Efetua a persistência transacional (upsert) dos registros de notas e faltas extraídos.
     * Ajusta automaticamente a escala de nota máxima (10.0, 30.0, 35.0 ou 100.0) de acordo com os dados.
     * Respeita a decisão do Especialista ('atualizar' ou 'manter') para períodos divergentes.
     */
    public function sincronizarRegistrosAcademicos(
        Turma $turma,
        array $dadosAlunos,
        string $periodoLetivo,
        string $dataAula,
        ?string $decisaoDivergencias = null,
        array $divergencias = []
    ): array {
        $notasSincronizadas = 0;
        $frequenciasSincronizadas = 0;
        $alertas = [];

        // Mapeia chaves de divergências caso a opção seja manter as notas anteriores
        $chavesDivergentes = [];
        if ($decisaoDivergencias === 'manter') {
            foreach ($divergencias as $div) {
                $chavesDivergentes["{$div['usuario_id']}_{$div['disciplina_id']}_{$div['periodo_letivo']}"] = true;
            }
        }

        DB::transaction(function () use (
            $turma,
            $dadosAlunos,
            $periodoLetivo,
            $dataAula,
            $decisaoDivergencias,
            $chavesDivergentes,
            &$notasSincronizadas,
            &$frequenciasSincronizadas
        ) {
            foreach ($dadosAlunos as $alunoItem) {
                $usuarioId = $alunoItem['usuario_id'];

                // 1. Sincroniza cada nota da planilha (Update or Create)
                foreach ($alunoItem['notas'] as $notaItem) {
                    $periodoDaNota = $notaItem['periodo_letivo'] ?? $periodoLetivo;
                    $chaveNota = "{$usuarioId}_{$notaItem['disciplina_id']}_{$periodoDaNota}";

                    // Se a decisão for manter, pula notas divergentes de períodos já cadastrados
                    if ($decisaoDivergencias === 'manter' && isset($chavesDivergentes[$chaveNota])) {
                        continue;
                    }

                    // Determina o valor máximo oficial correspondente ao período (1º Tri: 30, 2º Tri: 30, 3º Tri: 40)
                    $valorMaximoNota = $this->obterValorMaximoPeriodo($periodoDaNota);

                    Nota::updateOrCreate(
                        [
                            'turma_id' => $turma->id_turma,
                            'disciplina_id' => $notaItem['disciplina_id'],
                            'usuario_id' => $usuarioId,
                            'periodo_letivo' => $periodoDaNota,
                        ],
                        [
                            'tipo_avaliacao' => $notaItem['tipo_avaliacao'] ?? 'Diário Consolidado',
                            'valor_nota' => $notaItem['valor_nota'],
                            'valor_maximo' => $valorMaximoNota,
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

    /**
     * Gera a visão geral consolidada com KPIs, médias por turma e atualizações recentes
     * para o painel geral (/dashboard/geral), customizada por papel (Especialista vs Professor).
     */
    public function obterVisaoGeral(User $usuario): array
    {
        // 1. Determina as turmas do escopo com base no papel do usuário
        $isDocenteEstrito = $usuario->isProfessor() && ! $usuario->canManageAcademic();

        if ($isDocenteEstrito) {
            // Identifica as turmas e disciplinas onde o professor atua
            $vinculosDocente = TurmaDisciplina::where('professor_id', $usuario->id)->get();
            $turmasIds = $vinculosDocente->pluck('turma_id')->unique()->filter()->values();
            $disciplinasIdsProf = $vinculosDocente->pluck('disciplina_id')->unique()->filter()->values();

            // Se o professor possui turmas atribuídas, filtra por elas; caso contrário, fallback para turmas ativas
            if ($turmasIds->isNotEmpty()) {
                $turmas = Turma::whereIn('id_turma', $turmasIds)
                    ->where('status', 'Ativa')
                    ->orderBy('nome_identificador')
                    ->get();
            } else {
                $turmas = Turma::where('status', 'Ativa')->orderBy('nome_identificador')->get();
                $disciplinasIdsProf = collect();
            }
        } else {
            // Especialistas e Administradores visualizam todas as turmas ativas da instituição
            $turmas = Turma::where('status', 'Ativa')->orderBy('nome_identificador')->get();
            $disciplinasIdsProf = collect();
        }

        // Caso a escola não tenha turmas com status 'Ativa', busca todas
        if ($turmas->isEmpty()) {
            $turmas = Turma::orderBy('nome_identificador')->get();
        }

        $turmasIdsList = $turmas->pluck('id_turma')->toArray();

        // 2. Calcula os indicadores por turma (Médias de notas e Frequências)
        $mediasTurmas = [];
        $frequenciasTurmas = [];
        $somaMediasTurmas = 0.0;
        $turmasComNota = 0;
        $totalAulasGeral = 0;
        $totalFaltasGeral = 0;

        foreach ($turmas as $turma) {
            // Consulta de notas da turma (filtrando disciplinas do docente caso aplicável)
            $queryNotas = Nota::where('turma_id', $turma->id_turma);
            if ($isDocenteEstrito && $disciplinasIdsProf->isNotEmpty()) {
                $queryNotas->whereIn('disciplina_id', $disciplinasIdsProf);
            }
            $notas = $queryNotas->get();

            if ($notas->isNotEmpty()) {
                // Converte cada avaliação proporcionalmente para a escala de 0 a 10
                $aproveitamentoTurma = $notas->map(function ($nota) {
                    $max = $nota->valor_maximo > 0 ? (float) $nota->valor_maximo : 10.0;

                    return ((float) $nota->valor_nota / $max) * 10;
                })->avg();

                $mediaTurma = round((float) $aproveitamentoTurma, 1);
                $somaMediasTurmas += $mediaTurma;
                $turmasComNota++;
            } else {
                $mediaTurma = 0.0;
            }

            // Consulta de faltas e presenças da turma
            $queryFreq = Frequencia::where('turma_id', $turma->id_turma);
            if ($isDocenteEstrito && $disciplinasIdsProf->isNotEmpty()) {
                $queryFreq->whereIn('disciplina_id', $disciplinasIdsProf);
            }
            $aulasTurma = (int) (clone $queryFreq)->sum('quantidade_aulas');
            $faltasTurma = (int) (clone $queryFreq)->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');

            $totalAulasGeral += $aulasTurma;
            $totalFaltasGeral += $faltasTurma;

            $presencaTurma = $aulasTurma > 0
                ? (int) round((1 - ($faltasTurma / $aulasTurma)) * 100)
                : 100;

            $mediasTurmas[] = [
                'id' => $turma->id_turma,
                'turma' => $turma->nome_identificador,
                'nota' => $mediaTurma,
            ];

            $frequenciasTurmas[] = [
                'id' => $turma->id_turma,
                'turma' => $turma->nome_identificador,
                'percentual' => $presencaTurma,
            ];
        }

        // 3. Consolidação dos KPIs Superiores
        // Total de alunos ativos distintos no escopo
        $totalAlunos = Matricula::whereIn('turma_id', $turmasIdsList)
            ->where('status_matricula', 'Ativo')
            ->distinct('usuario_id')
            ->count('usuario_id');

        // Média geral agregada (escala 0-10)
        $mediaGeral = $turmasComNota > 0 ? round($somaMediasTurmas / $turmasComNota, 1) : 0.0;

        // Frequência média global em percentual
        $frequenciaMediaPercentual = $totalAulasGeral > 0
            ? round((1 - ($totalFaltasGeral / $totalAulasGeral)) * 100, 1)
            : 100.0;

        // Total de notícias publicadas no sistema
        $noticiasCount = Noticia::count();

        // 4. Últimas Atualizações Reais (Notícias recentes + Atualizações recentes de notas)
        $atualizacoes = [];

        // Notícias recentes (até 3)
        $noticiasRecentes = Noticia::orderByDesc('created_at')->limit(3)->get();
        foreach ($noticiasRecentes as $noticia) {
            $atualizacoes[] = [
                'id' => "noticia-{$noticia->id}",
                'tipo' => 'noticia',
                'texto' => "Nova notícia publicada: {$noticia->titulo}",
                'tempoAtras' => $noticia->created_at ? $noticia->created_at->locale('pt_BR')->diffForHumans() : 'recentemente',
                'timestamp' => $noticia->created_at?->timestamp ?? 0,
            ];
        }

        // Notas recentes (até 3)
        $notasRecentes = Nota::with(['turma', 'disciplina'])
            ->whereIn('turma_id', $turmasIdsList)
            ->orderByDesc('updated_at')
            ->limit(3)
            ->get();

        foreach ($notasRecentes as $nota) {
            $nomeTurma = $nota->turma?->nome_identificador ?? 'Turma';
            $nomeDisc = $nota->disciplina?->nome ?? 'Disciplina';
            $atualizacoes[] = [
                'id' => "nota-{$nota->id_nota}",
                'tipo' => 'notas',
                'texto' => "Notas atualizadas — {$nomeTurma} ({$nomeDisc})",
                'tempoAtras' => $nota->updated_at ? $nota->updated_at->locale('pt_BR')->diffForHumans() : 'recentemente',
                'timestamp' => $nota->updated_at?->timestamp ?? 0,
            ];
        }

        // Ordena atualizações por cronologia decrescente (mais recentes primeiro)
        usort($atualizacoes, fn ($a, $b) => $b['timestamp'] <=> $a['timestamp']);

        // Remove a chave de ordenação interna antes de entregar
        $ultimasAtualizacoes = array_map(function ($item) {
            unset($item['timestamp']);

            return $item;
        }, array_slice($atualizacoes, 0, 5));

        return [
            'kpis' => [
                'total_alunos' => $totalAlunos,
                'media_geral' => $mediaGeral,
                'frequencia_media' => "{$frequenciaMediaPercentual}%",
                'noticias_publicadas' => $noticiasCount,
                'total_turmas' => count($turmas),
            ],
            'resumo_turmas' => [
                'medias' => $mediasTurmas,
                'frequencias' => $frequenciasTurmas,
            ],
            'ultimas_atualizacoes' => $ultimasAtualizacoes,
        ];
    }
}
