<?php

namespace App\Services;

use App\Data\Academico\Csv\RegistroNotaCsvData;
use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Noticia;
use App\Models\PeriodoLetivo;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use App\Notifications\NotificacaoPortal;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Service responsável por processar inteligência acadêmica e dados analíticos
 * para alimentar a visão gerencial do Dashboard do Especialista Pedagógico.
 */
class EspecialistaDashboardService
{
    public function __construct(private readonly NotificacaoService $notificacaoService) {}

    /**
     * Processa uma planilha consolidada do diário escolar (formato padrão EEPSAS / DED MG),
     * detectando automaticamente metadados, cabeçalhos de disciplinas (inclusive em múltiplas linhas),
     * colunas de notas/faltas, e sincronizando exclusivamente notas e frequências no banco de dados.
     *
     * Regra de Isolamento Curricular: nunca cria disciplinas nem altera vínculos entre
     * Ciclos, Disciplinas, Professores, Turmas e Alunos.
     *
     * @param  Turma  $turma  Turma que receberá os lançamentos acadêmicos
     * @param  UploadedFile|string  $arquivo  Arquivo enviado via upload ou caminho em disco
     * @param  string|null  $periodoLetivo  Período dos lançamentos (ex: '1º Trimestre' ou '1º Bimestre')
     * @param  string|null  $dataAula  Data de referência para as faltas (formato Y-m-d)
     * @param  array  $mapeamentosManuais  Mapeamento de homônimos confirmados pelo Especialista [nome_csv => id_usuario|'ignorar']
     * @param  string|null  $decisaoDivergencias  Decisão do usuário para notas divergentes ('atualizar' ou 'manter')
     * @param  array  $mapeamentosDisciplinas  Correlação manual de colunas com disciplinas já vinculadas à turma
     * @return array Resumo com quantidade de registros processados e alertas
     */
    public function processarPlanilhaConsolidada(
        Turma $turma,
        UploadedFile|string $arquivo,
        ?string $periodoLetivo = null,
        ?string $dataAula = null,
        array $mapeamentosManuais = [],
        ?string $decisaoDivergencias = null,
        array $mapeamentosDisciplinas = []
    ): array {
        // Carrega estritamente as disciplinas já vinculadas à turma pelo usuário (garante isolamento entre Ciclos)
        $disciplinasDaTurma = $turma->disciplinas()->with('ciclos')->orderBy('nome')->get();

        if ($disciplinasDaTurma->isEmpty()) {
            throw ValidationException::withMessages([
                'arquivo' => 'Esta turma ainda não possui disciplinas vinculadas. Vincule o Ciclo Escolar ou as Disciplinas à turma antes de importar notas e faltas.',
            ]);
        }

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

        // Extrai os dados estruturados de notas e faltas conferindo colunas apenas contra as disciplinas da turma
        $dadosExtraidos = $this->extrairNotasEFaltasPorAluno(
            $linhas,
            $turma,
            $mapeamentosManuais,
            $periodo,
            $mapeamentosDisciplinas,
            $disciplinasDaTurma
        );

        // Se houver colunas de disciplinas no CSV sem correspondência exata na grade da turma,
        // interrompe a gravação para que o Especialista correlacione a uma disciplina da turma ou ignore a coluna.
        if (! empty($dadosExtraidos['disciplinas_pendentes'])) {
            $catalogoDaTurma = $disciplinasDaTurma
                ->map(fn (Disciplina $d) => [
                    'id_disciplina' => $d->id_disciplina,
                    'nome' => $d->nome,
                    'aulas_semanais' => $d->aulas_semanais,
                    'carga_horaria_anual' => $d->carga_horaria_anual,
                    'ciclos' => $d->ciclos->pluck('nome')->values()->all(),
                ])->values()->all();

            return [
                'status' => 'pendente_confirmacao',
                'tipo_pendencia' => 'conciliacao_disciplinas',
                'message' => 'Identificamos colunas de disciplinas na planilha que não correspondem exatamente à grade desta turma. Correlacione-as a uma disciplina já vinculada à turma ou ignore a coluna.',
                'disciplinas_pendentes' => array_values($dadosExtraidos['disciplinas_pendentes']),
                'catalogo_disciplinas' => $catalogoDaTurma,
                'ambiguidades' => [],
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

        // Detecta possíveis divergências entre notas e faltas já cadastradas e os novos valores do arquivo
        $divergencias = $this->detectarDivergenciasNotas($turma, $dadosExtraidos['alunos_dados'], $data);

        // Caso haja divergências e o Especialista ainda não tenha tomado a decisão ('atualizar' ou 'manter'):
        if (! empty($divergencias) && empty($decisaoDivergencias)) {
            return [
                'status' => 'pendente_confirmacao',
                'tipo_pendencia' => 'divergencias_notas',
                'message' => 'Identificamos divergências entre os lançamentos (notas e/ou faltas) do arquivo e o histórico já cadastrado para períodos anteriores. Por favor, confirme se deseja atualizar ou manter os registros anteriores.',
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
        $qtdNotasSinc = $resultadoSincronizacao['notas_sincronizadas'];
        $qtdFreqsSinc = $resultadoSincronizacao['frequencias_sincronizadas'];

        // Mensagem didática informando o sucesso da importação de notas e faltas e o tratamento aplicado
        $mensagemSucesso = match ($decisaoDivergencias) {
            'atualizar' => "Relatório processado: {$totalIdentificados} aluno(s), {$qtdNotasSinc} nota(s) e {$qtdFreqsSinc} registro(s) de frequência sincronizados. Os lançamentos divergentes de períodos anteriores foram atualizados com sucesso.",
            'manter' => "Relatório processado: {$totalIdentificados} aluno(s), {$qtdNotasSinc} nota(s) e {$qtdFreqsSinc} registro(s) de frequência sincronizados. Os registros anteriores divergentes foram mantidos e apenas os novos períodos foram importados.",
            default => $totalIgnorados > 0
                ? "Relatório processado: {$totalIdentificados} aluno(s), {$qtdNotasSinc} nota(s) e {$qtdFreqsSinc} registro(s) de frequência sincronizados. {$totalIgnorados} aluno(s) ignorado(s) por falta de cadastro institucional (@aluno.mg.gov.br) ou matrícula ativa."
                : "Relatório da turma importado com sucesso ({$qtdNotasSinc} nota(s) e {$qtdFreqsSinc} registro(s) de frequência sincronizados).",
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
     * Suporta trimestres (1º, 2º, 3º com variações 1°, 1o, 1. e abreviações TRI/TRIM),
     * bimestres (1º a 4º) e avaliações de recuperação (EIR).
     */
    public function normalizarPeriodoLetivo(string $texto, ?string $periodoFallback = null): ?string
    {
        $t = Str::upper(trim($texto));
        $ascii = Str::ascii($t);

        // Trimestres (suporta '1º TRI', '1° TRIM', '1o TRIMESTRE', 'FALTAS 1º TRI', etc.)
        if (preg_match('/1\s*([º°oª\.]|\b)\s*(tri|trimestre)/iu', $texto)
            || preg_match('/1\s*([º°oª\.]|\b)\s*(tri|trimestre)/iu', $ascii)
            || str_contains($t, '1º TRIM') || str_contains($t, '1 TRIM') || str_contains($t, '1ºTRIM')) {
            return '1º Trimestre';
        }
        if (preg_match('/2\s*([º°oª\.]|\b)\s*(tri|trimestre)/iu', $texto)
            || preg_match('/2\s*([º°oª\.]|\b)\s*(tri|trimestre)/iu', $ascii)
            || str_contains($t, '2º TRIM') || str_contains($t, '2 TRIM') || str_contains($t, '2ºTRIM')) {
            return '2º Trimestre';
        }
        if (preg_match('/3\s*([º°oª\.]|\b)\s*(tri|trimestre)/iu', $texto)
            || preg_match('/3\s*([º°oª\.]|\b)\s*(tri|trimestre)/iu', $ascii)
            || str_contains($t, '3º TRIM') || str_contains($t, '3 TRIM') || str_contains($t, '3ºTRIM')) {
            return '3º Trimestre';
        }

        // Bimestres (suporta '1º BIM', '1° BIMESTRE', etc.)
        if (preg_match('/1\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $texto)
            || preg_match('/1\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $ascii)
            || str_contains($t, '1º BIM') || str_contains($t, '1 BIM') || str_contains($t, '1ºBIM')) {
            return '1º Bimestre';
        }
        if (preg_match('/2\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $texto)
            || preg_match('/2\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $ascii)
            || str_contains($t, '2º BIM') || str_contains($t, '2 BIM') || str_contains($t, '2ºBIM')) {
            return '2º Bimestre';
        }
        if (preg_match('/3\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $texto)
            || preg_match('/3\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $ascii)
            || str_contains($t, '3º BIM') || str_contains($t, '3 BIM') || str_contains($t, '3ºBIM')) {
            return '3º Bimestre';
        }
        if (preg_match('/4\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $texto)
            || preg_match('/4\s*([º°oª\.]|\b)\s*(bim|bimestre)/iu', $ascii)
            || str_contains($t, '4º BIM') || str_contains($t, '4 BIM') || str_contains($t, '4ºBIM')) {
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
     * Retorna o valor máximo oficial baseado nas divisões do Período Letivo da Turma ou na escala padrão.
     */
    public function obterValorMaximoPeriodoComTurma(Turma $turma, ?string $periodo): float
    {
        if ($turma->periodoLetivo) {
            $divisao = $turma->periodoLetivo->divisoes()
                ->where('nome', $periodo)
                ->first();
            if ($divisao && (float) $divisao->pontos > 0) {
                return (float) $divisao->pontos;
            }
        }

        return $this->obterValorMaximoPeriodo($periodo);
    }

    /**
     * Determina a data de referência oficial para a etapa escolar/período.
     */
    public function obterDataReferenciaPeriodo(Turma $turma, ?string $periodo, ?string $dataFallback = null): string
    {
        $anoAtual = (int) ($turma->ano_letivo ?: date('Y'));

        if ($turma->periodoLetivo) {
            $divisao = $turma->periodoLetivo->divisoes()
                ->where('nome', $periodo)
                ->first();
            if ($divisao && ! empty($divisao->data_fim)) {
                return $divisao->data_fim->format('Y-m-d');
            }
        }

        if (! $periodo) {
            return $dataFallback ?: "{$anoAtual}-04-15";
        }

        $p = Str::lower(Str::ascii($periodo));
        if (str_contains($p, '1') && str_contains($p, 'tri')) {
            return "{$anoAtual}-04-15";
        }
        if (str_contains($p, '2') && str_contains($p, 'tri')) {
            return "{$anoAtual}-08-15";
        }
        if (str_contains($p, '3') && str_contains($p, 'tri')) {
            return "{$anoAtual}-11-15";
        }
        if (str_contains($p, '1') && str_contains($p, 'bim')) {
            return "{$anoAtual}-04-15";
        }
        if (str_contains($p, '2') && str_contains($p, 'bim')) {
            return "{$anoAtual}-06-30";
        }
        if (str_contains($p, '3') && str_contains($p, 'bim')) {
            return "{$anoAtual}-09-30";
        }
        if (str_contains($p, '4') && str_contains($p, 'bim')) {
            return "{$anoAtual}-12-15";
        }

        return $dataFallback ?: "{$anoAtual}-04-15";
    }

    /**
     * Calcula a quantidade prevista de aulas de uma disciplina na etapa ou no ano letivo (LDB Art. 24 / 40 semanas).
     */
    public function calcularAulasPrevistasDisciplina(
        Disciplina $disciplina,
        int $totalDivisoes = 3,
        bool $consolidadoAnual = false
    ): int {
        $cargaAnual = (int) ($disciplina->carga_horaria_anual ?: (($disciplina->aulas_semanais ?: 2) * 40));
        if ($cargaAnual <= 0) {
            $cargaAnual = 80;
        }

        if ($consolidadoAnual) {
            return max(20, $cargaAnual);
        }

        $divisoes = max(1, $totalDivisoes);

        return max(15, (int) round($cargaAnual / $divisoes));
    }

    /**
     * Verifica se um registro de Frequencia pertence a um período letivo específico (ex: '1º Trimestre').
     * Prioriza:
     * 1. Marcador explícito na justificativa do CSV ("... via diário escolar (1º Trimestre)");
     * 2. Intervalo de datas oficial da divisão cadastrada no Período Letivo da turma;
     * 3. Fallback pelo mês do calendário escolar (Trimestral ou Bimestral).
     */
    public function pertenceAoPeriodoFrequencia(
        Frequencia $frequencia,
        string $periodoAlvo,
        ?PeriodoLetivo $periodoLetivoTurma = null
    ): bool {
        $periodoNormAlvo = $this->normalizarPeriodoLetivo($periodoAlvo, trim($periodoAlvo)) ?? trim($periodoAlvo);
        $chaveAlvo = Str::lower(Str::ascii($periodoNormAlvo));

        // 1. Marcador explícito gravado durante a sincronização consolidada via CSV
        if (! empty($frequencia->justificativa) && preg_match('/\(([^)]+)\)\s*$/u', $frequencia->justificativa, $matches)) {
            $periodoTag = $this->normalizarPeriodoLetivo($matches[1], trim($matches[1])) ?? trim($matches[1]);

            return Str::lower(Str::ascii($periodoTag)) === $chaveAlvo;
        }

        $dataStr = $frequencia->data_aula instanceof \DateTimeInterface
            ? $frequencia->data_aula->format('Y-m-d')
            : substr((string) $frequencia->data_aula, 0, 10);

        if ($dataStr === '') {
            return false;
        }

        // 2. Intervalo oficial da divisão no Período Letivo da turma
        if ($periodoLetivoTurma && $periodoLetivoTurma->relationLoaded('divisoes')) {
            $divisao = $periodoLetivoTurma->divisoes->first(
                fn ($div) => Str::lower(Str::ascii(trim((string) $div->nome))) === $chaveAlvo
            );
            if ($divisao && $divisao->data_inicio && $divisao->data_fim) {
                $inicio = $divisao->data_inicio instanceof \DateTimeInterface
                    ? $divisao->data_inicio->format('Y-m-d')
                    : substr((string) $divisao->data_inicio, 0, 10);
                $fim = $divisao->data_fim instanceof \DateTimeInterface
                    ? $divisao->data_fim->format('Y-m-d')
                    : substr((string) $divisao->data_fim, 0, 10);

                return $dataStr >= $inicio && $dataStr <= $fim;
            }
        }

        // 3. Fallback para calendário escolar padrão
        $mes = (int) substr($dataStr, 5, 2);
        if (str_contains($chaveAlvo, 'tri') || in_array($chaveAlvo, ['1', '2', '3'], true)) {
            if (str_contains($chaveAlvo, '1')) {
                return $mes >= 1 && $mes <= 4;
            }
            if (str_contains($chaveAlvo, '2')) {
                return $mes >= 5 && $mes <= 8;
            }
            if (str_contains($chaveAlvo, '3')) {
                return $mes >= 9 && $mes <= 12;
            }
        }

        if (str_contains($chaveAlvo, 'bim')) {
            if (str_contains($chaveAlvo, '1')) {
                return $mes >= 1 && $mes <= 3;
            }
            if (str_contains($chaveAlvo, '2')) {
                return $mes >= 4 && $mes <= 6;
            }
            if (str_contains($chaveAlvo, '3')) {
                return $mes >= 7 && $mes <= 9;
            }
            if (str_contains($chaveAlvo, '4')) {
                return $mes >= 10 && $mes <= 12;
            }
        }

        return true;
    }

    /**
     * Faz a leitura das linhas do diário escolar da EEPSAS, suportando cabeçalhos de disciplinas
     * em múltiplas linhas e sub-cabeçalhos com trimestres alternados (1º, 2º, 3º TRIMESTRE, EIR, FALTAS).
     *
     * @param  array  $linhas  Linhas de texto do CSV
     * @param  Turma  $turma  Turma que está sendo processada
     * @param  array  $mapeamentosManuais  Mapeamentos de homônimos resolvidos pelo especialista [nome_csv => id_usuario|'ignorar']
     * @param  string|null  $periodoPadrao  Período padrão caso o arquivo não contenha sub-cabeçalhos de trimestres
     * @param  array  $mapeamentosDisciplinas  Correlação manual de cabeçalhos com disciplinas da turma
     * @param  Collection<int, Disciplina>|null  $disciplinasDaTurma  Disciplinas previamente vinculadas à turma
     * @return array Dados estruturados contendo 'alunos_dados', 'ambiguidades', 'disciplinas_pendentes' e 'alertas'
     */
    public function extrairNotasEFaltasPorAluno(
        array $linhas,
        Turma $turma,
        array $mapeamentosManuais = [],
        ?string $periodoPadrao = null,
        array $mapeamentosDisciplinas = [],
        ?Collection $disciplinasDaTurma = null
    ): array {
        $alertas = [];
        $alunosDados = [];
        $ambiguidades = [];
        $alunosIgnorados = [];
        $disciplinasPendentes = [];
        $colunasIgnoradasAvisadas = [];

        // Garante que a conferência utilize estritamente as disciplinas vinculadas à turma alvo
        $disciplinasVinculadas = $disciplinasDaTurma
            ?? $turma->disciplinas()->with('ciclos')->orderBy('nome')->get();

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
                $colunaAlunoVazia = trim($colunasTeste[$indiceAluno] ?? '') === '';
                // Se a coluna do aluno está vazia e possui poucas colunas preenchidas (ex: quebra de título como "SISTEMAS"), agrupa
                if ($colunaAlunoVazia && count($naoVazias) > 0 && count($naoVazias) <= 8) {
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
            $ultimoPeriodoDetectado = $periodoPadrao ?: '1º Trimestre';
            $maxCols = max(count($cabecalhos), count($subCabecalhos));

            for ($c = 0; $c < $maxCols; $c++) {
                if ($c === $indiceAluno) {
                    continue;
                }

                $nomeNaColuna = trim($cabecalhos[$c] ?? '');
                if (! empty($nomeNaColuna)) {
                    $disciplinaAtualNome = $nomeNaColuna;
                    // Ao iniciar nova disciplina, reestabelece o período base
                    $ultimoPeriodoDetectado = $periodoPadrao ?: '1º Trimestre';
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

                // Sanitiza e confere a disciplina do CSV exclusivamente contra as disciplinas já vinculadas à turma
                $disciplinaModel = $this->conciliarDisciplinaCsv(
                    $disciplinaAtualNome,
                    $turma,
                    $disciplinasVinculadas,
                    $mapeamentosDisciplinas,
                    $disciplinasPendentes,
                    $alertas,
                    $colunasIgnoradasAvisadas
                );

                if (! $disciplinaModel) {
                    $mapaColunas[$c] = ['tipo' => 'ignorar'];

                    continue;
                }

                // Detecta dinamicamente a divisão/período (1º Tri, 2º Tri, 3º Tri, Bimestre, EIR)
                // Se a coluna contiver referência a um período (mesmo sendo falta, ex: 'Faltas 1º Tri'), atualiza
                $periodoDetectadoNaColuna = $this->normalizarPeriodoLetivo($subTexto);
                if ($periodoDetectadoNaColuna !== null) {
                    $ultimoPeriodoDetectado = $periodoDetectadoNaColuna;
                }

                $periodoDaColuna = $ultimoPeriodoDetectado;
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
            foreach ($cabecalhos as $colIdx => $nomeColuna) {
                if ($colIdx === $indiceAluno) {
                    continue;
                }

                $nomeUpper = Str::upper(trim($nomeColuna));
                if ($nomeUpper === 'TOTAL' || str_contains($nomeUpper, 'TOTAL') || $nomeUpper === '') {
                    $mapaColunas[$colIdx] = ['tipo' => 'ignorar'];

                    continue;
                }

                $nomeNorm = Str::lower(Str::ascii($nomeColuna));
                $isFalta = str_contains($nomeNorm, 'falta') || str_contains($nomeNorm, 'ausencia');

                // Remove prefixos como "Faltas " para identificar o nome limpo da disciplina
                $nomeLimpoDisciplina = trim((string) preg_replace('/^(faltas|falta|ausencias|ausencia)\s+/iu', '', trim($nomeColuna)));

                $disciplinaModel = $this->conciliarDisciplinaCsv(
                    $nomeLimpoDisciplina ?: $nomeColuna,
                    $turma,
                    $disciplinasVinculadas,
                    $mapeamentosDisciplinas,
                    $disciplinasPendentes,
                    $alertas,
                    $colunasIgnoradasAvisadas
                );

                if ($disciplinaModel) {
                    $periodoDaColuna = $this->normalizarPeriodoLetivo($nomeColuna, $periodoPadrao ?: '1º Trimestre');
                    $isRecuperacao = str_contains($nomeUpper, 'EIR') || str_contains($nomeUpper, 'RECUPERA');

                    $mapaColunas[$colIdx] = [
                        'tipo' => $isFalta ? 'falta' : 'nota',
                        'disciplina_id' => $disciplinaModel->id_disciplina,
                        'nome_disciplina' => $disciplinaModel->nome,
                        'periodo_letivo' => $periodoDaColuna,
                        'tipo_avaliacao' => $isRecuperacao ? 'Recuperação (EIR)' : 'Diário Consolidado',
                    ];
                } else {
                    $mapaColunas[$colIdx] = ['tipo' => 'ignorar'];
                }
            }

            $primeiraLinhaAlunosIdx = $linhaCabecalhoIdx + 1;
        }

        // Identifica se uma disciplina possui apenas uma coluna de faltas consolidada para múltiplos períodos de notas
        $faltasPorDisciplina = [];
        $notasPorDisciplina = [];
        foreach ($mapaColunas as $colIdx => $colInfo) {
            if (($colInfo['tipo'] ?? '') === 'ignorar' || empty($colInfo['disciplina_id'])) {
                continue;
            }
            if ($colInfo['tipo'] === 'falta') {
                $faltasPorDisciplina[$colInfo['disciplina_id']][] = $colIdx;
            } elseif ($colInfo['tipo'] === 'nota') {
                $notasPorDisciplina[$colInfo['disciplina_id']][] = $colInfo['periodo_letivo'];
            }
        }

        foreach ($faltasPorDisciplina as $discId => $colIndices) {
            $periodosNotas = array_values(array_unique($notasPorDisciplina[$discId] ?? []));
            // Se há exatamente 1 coluna de faltas para esta matéria e ela possui notas em 2 ou mais períodos
            if (count($colIndices) === 1 && count($periodosNotas) > 1) {
                $colIdxFalta = $colIndices[0];
                $textoCol = $subCabecalhoIdx !== null
                    ? trim($subCabecalhos[$colIdxFalta] ?? '')
                    : trim($cabecalhos[$colIdxFalta] ?? '');

                // Se o texto da coluna não especifica um período individual (ex: 'FALTAS 1º TRI')
                if ($this->normalizarPeriodoLetivo($textoCol) === null) {
                    $mapaColunas[$colIdxFalta]['tipo'] = 'falta_acumulada';
                    $mapaColunas[$colIdxFalta]['periodos_disciplina'] = $periodosNotas;
                }
            }
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

            // Localiza o aluno previamente cadastrado através da desambiguação manual ou heurística resiliente
            $alunoEncontrado = null;

            // 1. Caso o Especialista já tenha resolvido a ambiguidade manualmente pelo modal
            if (isset($mapeamentosManuais[$identificadorAluno])) {
                $opcaoEscolhida = $mapeamentosManuais[$identificadorAluno];
                if ($opcaoEscolhida !== 'ignorar' && $opcaoEscolhida !== 'nenhum') {
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

                $valorNormalizado = str_replace(',', '.', $valorBruto);
                $nomeDiscColuna = (string) ($infoColuna['nome_disciplina'] ?? 'Disciplina');
                $periodoColuna = (string) ($infoColuna['periodo_letivo'] ?? ($periodoPadrao ?: '1º Trimestre'));

                if (! is_numeric($valorNormalizado)) {
                    $alertas[] = "Lançamento ignorado para '{$alunoEncontrado->name}' em '{$nomeDiscColuna}' ({$periodoColuna}): valor '{$valorBruto}' não é numérico.";

                    continue;
                }

                $valorNumerico = (float) $valorNormalizado;

                try {
                    if ($infoColuna['tipo'] === 'nota') {
                        // Revalida o lançamento de nota via Spatie Data (0 a 100 pontos)
                        $registro = RegistroNotaCsvData::validateAndCreate([
                            'usuario_id' => $alunoEncontrado->id,
                            'nome_aluno' => $alunoEncontrado->name,
                            'disciplina_id' => (int) $infoColuna['disciplina_id'],
                            'nome_disciplina' => $nomeDiscColuna,
                            'periodo_letivo' => $periodoColuna,
                            'tipo_registro' => 'nota',
                            'tipo_avaliacao' => (string) ($infoColuna['tipo_avaliacao'] ?? 'Diário Consolidado'),
                            'valor_nota' => $valorNumerico,
                            'quantidade_faltas' => null,
                        ]);

                        $notasDoAluno[] = [
                            'disciplina_id' => $registro->disciplina_id,
                            'nome_disciplina' => $registro->nome_disciplina,
                            'periodo_letivo' => $registro->periodo_letivo,
                            'tipo_avaliacao' => $registro->tipo_avaliacao ?? 'Diário Consolidado',
                            'valor_nota' => (float) $registro->valor_nota,
                        ];
                    } elseif ($infoColuna['tipo'] === 'falta_acumulada') {
                        // Revalida o lançamento de faltas acumuladas via Spatie Data (inteiro >= 0)
                        if (floor($valorNumerico) !== $valorNumerico) {
                            $alertas[] = "Lançamento de faltas ignorado para '{$alunoEncontrado->name}' em '{$nomeDiscColuna}' ({$periodoColuna}): valor '{$valorBruto}' deve ser inteiro.";

                            continue;
                        }

                        $qtdTotalFaltas = (int) $valorNumerico;
                        $periodosDisciplina = $infoColuna['periodos_disciplina'] ?? [$periodoColuna];
                        $totalPeriodos = count($periodosDisciplina);
                        $baseFaltas = intdiv($qtdTotalFaltas, $totalPeriodos);
                        $restoFaltas = $qtdTotalFaltas % $totalPeriodos;

                        foreach ($periodosDisciplina as $pIdx => $periodoItem) {
                            // Distribui o resto das faltas nas etapas mais recentes
                            $qtdPeriodo = $baseFaltas + ($pIdx >= ($totalPeriodos - $restoFaltas) ? 1 : 0);

                            $registro = RegistroNotaCsvData::validateAndCreate([
                                'usuario_id' => $alunoEncontrado->id,
                                'nome_aluno' => $alunoEncontrado->name,
                                'disciplina_id' => (int) $infoColuna['disciplina_id'],
                                'nome_disciplina' => $nomeDiscColuna,
                                'periodo_letivo' => $periodoItem,
                                'tipo_registro' => 'falta',
                                'tipo_avaliacao' => null,
                                'valor_nota' => null,
                                'quantidade_faltas' => $qtdPeriodo,
                            ]);

                            $faltasDoAluno[] = [
                                'disciplina_id' => $registro->disciplina_id,
                                'nome_disciplina' => $registro->nome_disciplina,
                                'quantidade_faltas' => (int) $registro->quantidade_faltas,
                                'periodo_letivo' => $registro->periodo_letivo,
                            ];
                        }
                    } else {
                        // Revalida o lançamento de faltas via Spatie Data (inteiro >= 0)
                        if (floor($valorNumerico) !== $valorNumerico) {
                            $alertas[] = "Lançamento de faltas ignorado para '{$alunoEncontrado->name}' em '{$nomeDiscColuna}' ({$periodoColuna}): valor '{$valorBruto}' deve ser inteiro.";

                            continue;
                        }

                        $registro = RegistroNotaCsvData::validateAndCreate([
                            'usuario_id' => $alunoEncontrado->id,
                            'nome_aluno' => $alunoEncontrado->name,
                            'disciplina_id' => (int) $infoColuna['disciplina_id'],
                            'nome_disciplina' => $nomeDiscColuna,
                            'periodo_letivo' => $periodoColuna,
                            'tipo_registro' => 'falta',
                            'tipo_avaliacao' => null,
                            'valor_nota' => null,
                            'quantidade_faltas' => (int) $valorNumerico,
                        ]);

                        $faltasDoAluno[] = [
                            'disciplina_id' => $registro->disciplina_id,
                            'nome_disciplina' => $registro->nome_disciplina,
                            'quantidade_faltas' => (int) $registro->quantidade_faltas,
                            'periodo_letivo' => $registro->periodo_letivo,
                        ];
                    }
                } catch (ValidationException) {
                    $alertas[] = "Lançamento ignorado para '{$alunoEncontrado->name}' em '{$nomeDiscColuna}' ({$periodoColuna}): valor '{$valorBruto}' fora dos limites permitidos.";
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
            'disciplinas_pendentes' => $disciplinasPendentes,
            'alertas' => $alertas,
            'alunos_ignorados' => $alunosIgnorados,
        ];
    }

    /**
     * Sanitiza o cabeçalho de disciplina do CSV e confere estritamente contra as disciplinas
     * já vinculadas à própria turma, sem criar disciplinas nem modificar vínculos de Ciclos,
     * Professores ou Turmas.
     *
     * @param  Collection<int, Disciplina>  $disciplinasDaTurma
     * @param  array<string, mixed>  $mapeamentosDisciplinas
     * @param  array<string, array<string, mixed>>  $disciplinasPendentes
     * @param  array<int, string>  $alertas
     * @param  array<string, bool>  $colunasIgnoradasAvisadas
     */
    private function conciliarDisciplinaCsv(
        string $nomeBrutoCsv,
        Turma $turma,
        Collection $disciplinasDaTurma,
        array $mapeamentosDisciplinas,
        array &$disciplinasPendentes,
        array &$alertas,
        array &$colunasIgnoradasAvisadas
    ): ?Disciplina {
        // Sanitiza espaços múltiplos e caracteres de controle
        $nomeSanitizado = trim((string) preg_replace('/\s+/', ' ', $nomeBrutoCsv));
        if ($nomeSanitizado === '') {
            return null;
        }

        $normCsv = Str::lower(Str::ascii($nomeSanitizado));
        $decisaoManual = $mapeamentosDisciplinas[$nomeBrutoCsv] ?? $mapeamentosDisciplinas[$nomeSanitizado] ?? null;

        // 1. Verifica se o Especialista já informou a decisão manual no modal de conciliação
        if ($decisaoManual !== null) {
            $acao = is_array($decisaoManual) ? (string) ($decisaoManual['acao'] ?? '') : (string) $decisaoManual;

            if ($acao === 'ignorar') {
                // Emite um único aviso informativo por coluna descartada no resumo da importação
                if (! isset($colunasIgnoradasAvisadas[$nomeSanitizado])) {
                    $colunasIgnoradasAvisadas[$nomeSanitizado] = true;
                    $alertas[] = "Coluna '{$nomeSanitizado}' ignorada conforme seleção na conciliação.";
                }

                return null;
            }

            // Bloqueia tentativas de criar disciplinas via CSV: o cadastro e vínculo são exclusivos do usuário
            if ($acao !== 'vincular' && ! is_numeric($acao)) {
                throw ValidationException::withMessages([
                    "mapeamentos_disciplinas.{$nomeSanitizado}.acao" => "Ação inválida para '{$nomeSanitizado}'. A importação CSV permite apenas correlacionar a uma disciplina já vinculada à turma ou ignorar a coluna.",
                ]);
            }

            $idManual = is_array($decisaoManual)
                ? (int) ($decisaoManual['disciplina_id'] ?? $decisaoManual['id_disciplina'] ?? 0)
                : (int) $acao;

            // Busca exclusivamente na coleção de disciplinas já vinculadas à turma (impede cruzar ciclos)
            $disciplinaEscolhida = $disciplinasDaTurma->firstWhere('id_disciplina', $idManual);

            if (! $disciplinaEscolhida) {
                throw ValidationException::withMessages([
                    "mapeamentos_disciplinas.{$nomeSanitizado}.disciplina_id" => "A disciplina selecionada para '{$nomeSanitizado}' não está vinculada à turma '{$turma->nome_identificador}'.",
                ]);
            }

            return $disciplinaEscolhida;
        }

        // 2. Conciliação automática exata restrita às disciplinas já vinculadas à turma
        $correspondenciasExatas = $disciplinasDaTurma->filter(function (Disciplina $d) use ($normCsv) {
            return Str::lower(Str::ascii(trim($d->nome))) === $normCsv;
        })->values();

        // Retorna imediatamente a disciplina da turma sem alterar nenhum vínculo de ciclo, turma ou professor
        if ($correspondenciasExatas->count() === 1) {
            return $correspondenciasExatas->first();
        }

        // 3. Sem correspondência exata única na turma: busca sugestão por similaridade apenas na grade da turma
        $sugestaoSimilar = $correspondenciasExatas->first() ?? $disciplinasDaTurma->first(function (Disciplina $d) use ($normCsv) {
            $discNorm = Str::lower(Str::ascii(trim($d->nome)));

            return $discNorm !== '' && (str_contains($normCsv, $discNorm) || str_contains($discNorm, $normCsv));
        });

        // 4. Registra pendência para o Especialista correlacionar a uma disciplina da turma ou ignorar a coluna
        if (! isset($disciplinasPendentes[$nomeSanitizado])) {
            $disciplinasPendentes[$nomeSanitizado] = [
                'nome_csv' => $nomeSanitizado,
                'sugestao_disciplina_id' => $sugestaoSimilar?->id_disciplina,
                'sugestao_disciplina_nome' => $sugestaoSimilar?->nome,
            ];
        }

        return null;
    }

    /**
     * Compara as notas e as faltas extraídas da planilha com o histórico já registrado no banco para a turma.
     * Identifica divergências quando uma nota difere em mais de 0.01 ponto ou quando a quantidade de faltas
     * consolidada para um período já cadastrado difere do valor atualmente salvo.
     *
     * @param  Turma  $turma  Turma que está sendo processada
     * @param  array  $alunosDados  Array de alunos com suas respectivas notas e faltas
     * @return array<int, array<string, mixed>>
     */
    public function detectarDivergenciasNotas(Turma $turma, array $alunosDados, ?string $dataFallback = null): array
    {
        $mapaDivergencias = [];

        // Carrega em cache as notas e frequências existentes da turma sem N+1
        $notasExistentes = Nota::with('disciplina')
            ->where('turma_id', $turma->id_turma)
            ->get()
            ->groupBy(fn (Nota $n) => "{$n->usuario_id}_{$n->disciplina_id}_{$n->periodo_letivo}");

        $frequenciasExistentes = Frequencia::with('disciplina')
            ->where('turma_id', $turma->id_turma)
            ->get()
            ->groupBy(fn (Frequencia $f) => "{$f->usuario_id}_{$f->disciplina_id}");

        foreach ($alunosDados as $alunoItem) {
            $usuarioId = (int) $alunoItem['usuario_id'];
            $nomeAluno = (string) $alunoItem['nome_aluno'];

            // Indexa notas novas da planilha por chave para cruzamento com divergências de faltas
            $novasNotasIndexadas = [];
            foreach ($alunoItem['notas'] ?? [] as $nItem) {
                $novasNotasIndexadas["{$usuarioId}_{$nItem['disciplina_id']}_{$nItem['periodo_letivo']}"] = (float) $nItem['valor_nota'];
            }

            // Indexa faltas novas da planilha por chave para cruzamento com divergências de notas
            $novasFaltasIndexadas = [];
            foreach ($alunoItem['faltas'] ?? [] as $fItem) {
                $novasFaltasIndexadas["{$usuarioId}_{$fItem['disciplina_id']}_{$fItem['periodo_letivo']}"] = (int) $fItem['quantidade_faltas'];
            }

            // 1. Verifica divergências de notas em etapas já cadastradas
            foreach ($alunoItem['notas'] ?? [] as $notaItem) {
                $disciplinaId = (int) $notaItem['disciplina_id'];
                $periodoLetivo = (string) $notaItem['periodo_letivo'];
                $novaNota = (float) $notaItem['valor_nota'];

                $chave = "{$usuarioId}_{$disciplinaId}_{$periodoLetivo}";
                $notaRegistrada = $notasExistentes->get($chave)?->first();

                if ($notaRegistrada !== null) {
                    $notaAtual = (float) $notaRegistrada->valor_nota;

                    if (abs($notaAtual - $novaNota) > 0.01) {
                        $mapaDivergencias[$chave] = [
                            'usuario_id' => $usuarioId,
                            'nome_aluno' => $nomeAluno,
                            'disciplina_id' => $disciplinaId,
                            'nome_disciplina' => $notaItem['nome_disciplina'] ?: ($notaRegistrada->disciplina?->nome ?? 'Disciplina'),
                            'periodo_letivo' => $periodoLetivo,
                            'nota_atual' => $notaAtual,
                            'nova_nota' => $novaNota,
                            'tipo_divergencia' => 'nota',
                            'faltas_atuais' => null,
                            'novas_faltas' => $novasFaltasIndexadas[$chave] ?? null,
                        ];
                    }
                }
            }

            // 2. Verifica divergências de faltas em etapas já sincronizadas no banco
            foreach ($alunoItem['faltas'] ?? [] as $faltaItem) {
                $disciplinaId = (int) $faltaItem['disciplina_id'];
                $periodoLetivo = (string) $faltaItem['periodo_letivo'];
                $novasFaltas = (int) $faltaItem['quantidade_faltas'];

                $chave = "{$usuarioId}_{$disciplinaId}_{$periodoLetivo}";
                $dataRef = $this->obterDataReferenciaPeriodo($turma, $periodoLetivo, $dataFallback);
                $chavePeriodoAscii = Str::lower(Str::ascii(trim($periodoLetivo)));

                $freqsAlunoDisc = $frequenciasExistentes->get("{$usuarioId}_{$disciplinaId}", collect());
                $freqRegistrada = $freqsAlunoDisc->first(function (Frequencia $f) use ($dataRef, $chavePeriodoAscii) {
                    if (! empty($f->justificativa) && preg_match('/\(([^)]+)\)\s*$/u', $f->justificativa, $m)) {
                        $tagNorm = $this->normalizarPeriodoLetivo($m[1], trim($m[1])) ?? trim($m[1]);

                        return Str::lower(Str::ascii($tagNorm)) === $chavePeriodoAscii;
                    }

                    $dAula = $f->data_aula instanceof \DateTimeInterface
                        ? $f->data_aula->format('Y-m-d')
                        : substr((string) $f->data_aula, 0, 10);

                    return $dAula === $dataRef;
                });

                if ($freqRegistrada !== null) {
                    $faltasAtuais = in_array($freqRegistrada->status_presenca, ['Falta', 'Falta Justificada'], true)
                        ? (int) $freqRegistrada->quantidade_aulas
                        : 0;

                    if (isset($mapaDivergencias[$chave])) {
                        $mapaDivergencias[$chave]['faltas_atuais'] = $faltasAtuais;
                        $mapaDivergencias[$chave]['novas_faltas'] = $novasFaltas;
                        if ($faltasAtuais !== $novasFaltas) {
                            $mapaDivergencias[$chave]['tipo_divergencia'] = 'ambos';
                        }
                    } elseif ($faltasAtuais !== $novasFaltas) {
                        $notaExistentePeriodo = $notasExistentes->get($chave)?->first();
                        $notaBase = $notaExistentePeriodo !== null
                            ? (float) $notaExistentePeriodo->valor_nota
                            : ($novasNotasIndexadas[$chave] ?? 0.0);

                        $mapaDivergencias[$chave] = [
                            'usuario_id' => $usuarioId,
                            'nome_aluno' => $nomeAluno,
                            'disciplina_id' => $disciplinaId,
                            'nome_disciplina' => ($faltaItem['nome_disciplina'] ?? null) ?: ($freqRegistrada->disciplina?->nome ?? 'Disciplina'),
                            'periodo_letivo' => $periodoLetivo,
                            'nota_atual' => $notaBase,
                            'nova_nota' => $novasNotasIndexadas[$chave] ?? $notaBase,
                            'tipo_divergencia' => 'falta',
                            'faltas_atuais' => $faltasAtuais,
                            'novas_faltas' => $novasFaltas,
                        ];
                    }
                }
            }
        }

        return array_values($mapaDivergencias);
    }

    /**
     * Efetua a persistência transacional (upsert) dos registros de notas e faltas extraídos.
     * Ajusta automaticamente a escala de nota máxima (10.0, 30.0, 35.0 ou 100.0) de acordo com os dados.
     * Respeita a decisão do Especialista ('atualizar' ou 'manter') para períodos divergentes em notas e faltas.
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

        // Mapeia chaves de divergências separando notas e faltas caso a opção seja manter o histórico anterior
        $chavesNotasDivergentes = [];
        $chavesFaltasDivergentes = [];
        if ($decisaoDivergencias === 'manter') {
            foreach ($divergencias as $div) {
                $chaveItem = "{$div['usuario_id']}_{$div['disciplina_id']}_{$div['periodo_letivo']}";
                $tipoDiv = (string) ($div['tipo_divergencia'] ?? 'nota');
                if (in_array($tipoDiv, ['nota', 'ambos'], true)) {
                    $chavesNotasDivergentes[$chaveItem] = true;
                }
                if (in_array($tipoDiv, ['falta', 'ambos'], true)) {
                    $chavesFaltasDivergentes[$chaveItem] = true;
                }
            }
        }

        DB::transaction(function () use (
            $turma,
            $dadosAlunos,
            $periodoLetivo,
            $dataAula,
            $decisaoDivergencias,
            $chavesNotasDivergentes,
            $chavesFaltasDivergentes,
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
                    if ($decisaoDivergencias === 'manter' && isset($chavesNotasDivergentes[$chaveNota])) {
                        continue;
                    }

                    // Determina a data de referência oficial e o valor máximo conforme o período da nota
                    $dataNota = $this->obterDataReferenciaPeriodo($turma, $periodoDaNota, $dataAula);
                    $valorMaximoNota = $this->obterValorMaximoPeriodoComTurma($turma, $periodoDaNota);

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
                            'data_registro' => $dataNota,
                            'observacoes' => 'Importado via diário escolar consolidado do Especialista',
                        ]
                    );
                    $notasSincronizadas++;
                }

                // 2. Sincroniza cada registro de faltas respeitando decisões de divergência e marcando a etapa na justificativa
                foreach ($alunoItem['faltas'] as $faltaItem) {
                    $qtdFaltas = (int) $faltaItem['quantidade_faltas'];
                    $periodoDaFalta = $faltaItem['periodo_letivo'] ?? $periodoLetivo;
                    $chaveFalta = "{$usuarioId}_{$faltaItem['disciplina_id']}_{$periodoDaFalta}";

                    if ($decisaoDivergencias === 'manter' && isset($chavesFaltasDivergentes[$chaveFalta])) {
                        continue;
                    }

                    $dataFalta = $this->obterDataReferenciaPeriodo($turma, $periodoDaFalta, $dataAula);

                    Frequencia::updateOrCreate(
                        [
                            'turma_id' => $turma->id_turma,
                            'disciplina_id' => $faltaItem['disciplina_id'],
                            'usuario_id' => $usuarioId,
                            'data_aula' => $dataFalta,
                        ],
                        [
                            'quantidade_aulas' => max(1, $qtdFaltas),
                            'status_presenca' => $qtdFaltas > 0 ? 'Falta' : 'Presente',
                            'justificativa' => $qtdFaltas > 0
                                ? "Registro de faltas via diário escolar ({$periodoDaFalta})"
                                : "Presença integral via diário escolar ({$periodoDaFalta})",
                        ]
                    );
                    $frequenciasSincronizadas++;
                }
            }

            // Mantém os avisos no mesmo commit dos dados importados, sem notificações parciais.
            $this->notificacaoService->notificarImportacaoAcademica(
                $turma,
                $dadosAlunos,
                $periodoLetivo,
                $dataAula
            );
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
     * Respeita o filtro opcional de período e projeta a carga horária prevista por disciplina (LDB Art. 24)
     * quando os lançamentos provêm de importação consolidada CSV (onde não há chamadas diárias avulsas).
     */
    public function calcularTaxaAbsenteismoTurma(Turma $turma, ?string $periodo = null): float
    {
        $frequencias = Frequencia::with('disciplina')
            ->where('turma_id', $turma->id_turma)
            ->get();

        if ($frequencias->isEmpty()) {
            return 0.0;
        }

        $periodoLetivoTurma = $turma->periodoLetivo()->with('divisoes')->first()
            ?? PeriodoLetivo::where('ano', $turma->ano_letivo)->with('divisoes')->first();
        $totalDivisoes = max(1, $periodoLetivoTurma?->divisoes?->count() ?: 3);

        if (! empty($periodo) && strtolower(trim($periodo)) !== 'todos') {
            $frequencias = $frequencias->filter(
                fn (Frequencia $f) => $this->pertenceAoPeriodoFrequencia($f, $periodo, $periodoLetivoTurma)
            );
        }

        if ($frequencias->isEmpty()) {
            return 0.0;
        }

        $somaFaltas = 0;
        $somaAulas = 0;

        foreach ($frequencias->groupBy(fn (Frequencia $f) => "{$f->usuario_id}_{$f->disciplina_id}") as $freqsGrupo) {
            $faltasGrupo = (int) $freqsGrupo
                ->whereIn('status_presenca', ['Falta', 'Falta Justificada'])
                ->sum('quantidade_aulas');
            $aulasRegistradas = (int) $freqsGrupo->sum('quantidade_aulas');
            $temOrigemCsv = $freqsGrupo->contains(
                fn (Frequencia $f) => str_contains((string) $f->justificativa, 'via diário escolar')
            );

            if (! $temOrigemCsv && $aulasRegistradas > $faltasGrupo) {
                $aulasGrupo = $aulasRegistradas;
            } else {
                $etapasLancadas = max(1, $freqsGrupo->count());
                $disc = $freqsGrupo->first()?->disciplina;
                $aulasPorEtapa = $disc
                    ? $this->calcularAulasPrevistasDisciplina($disc, $totalDivisoes, false)
                    : max(15, (int) round(80 / $totalDivisoes));
                $aulasGrupo = max($faltasGrupo, $aulasPorEtapa * $etapasLancadas);
            }

            $somaFaltas += $faltasGrupo;
            $somaAulas += $aulasGrupo;
        }

        return $somaAulas > 0 ? round(($somaFaltas / $somaAulas) * 100, 2) : 0.0;
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
     *
     * @return array<string, mixed>
     */
    public function obterVisaoGeral(User $usuario, ?string $divisaoFiltro = null): array
    {
        // 0. Identifica o período letivo ativo e suas divisões
        $periodoAtivo = PeriodoLetivo::with('divisoes')->where('ativo', true)->first();
        $divisaoAtual = $periodoAtivo?->obterDivisaoAtual();
        $divisaoEfetiva = $divisaoFiltro ?: ($divisaoAtual ? $divisaoAtual->nome : null);
        $divisaoObjeto = $periodoAtivo?->divisoes->firstWhere('nome', $divisaoEfetiva);
        $pontosDivisao = $divisaoObjeto ? (float) $divisaoObjeto->pontos : 30.0;
        $pontosConsolidados = $periodoAtivo?->divisoes
            ->filter(fn ($divisao) => $divisao->data_fim && Carbon::parse($divisao->data_fim)->lt(Carbon::today()))
            ->sum('pontos') ?? 0.0;

        // 1. Determina as turmas do escopo com base no papel do usuário
        $isDocenteEstrito = $usuario->isProfessor() && ! $usuario->canManageAcademic();

        $anoVigente = $periodoAtivo?->ano;
        $totalDivisoesPeriodo = max(1, $periodoAtivo?->divisoes?->count() ?: 3);

        if ($isDocenteEstrito) {
            // Diretriz 3.4a: Garante que as disciplinas vinculadas ao professor propaguem seus vínculos com os Ciclos e Turmas
            $disciplinasDoProfessor = $usuario->disciplinasDocente()->with('ciclos.turmas')->get();
            foreach ($disciplinasDoProfessor as $discDocente) {
                $discDocente->sincronizarComTurmasDosCiclos();
            }

            // Identifica as turmas e disciplinas onde o professor atua (diretas ou herdadas dos ciclos)
            $vinculosDocente = TurmaDisciplina::where('professor_id', $usuario->id)->get();
            $disciplinasIdsProf = $vinculosDocente->pluck('disciplina_id')
                ->merge($disciplinasDoProfessor->pluck('id_disciplina'))
                ->unique()
                ->filter()
                ->values();

            $turmasIdsHeranca = $disciplinasIdsProf->isNotEmpty()
                ? TurmaDisciplina::whereIn('disciplina_id', $disciplinasIdsProf)->pluck('turma_id')
                : collect();
            $turmasIds = $vinculosDocente->pluck('turma_id')
                ->merge($turmasIdsHeranca)
                ->unique()
                ->filter()
                ->values();

            // Considera estritamente as turmas ativas do ano letivo em vigor vinculadas ao docente
            $queryTurmasDocente = Turma::where('status', 'Ativa');
            if ($anoVigente) {
                $queryTurmasDocente->where('ano_letivo', $anoVigente);
            }

            if ($turmasIds->isNotEmpty()) {
                $turmas = (clone $queryTurmasDocente)->whereIn('id_turma', $turmasIds)
                    ->orderBy('nome_identificador')
                    ->get();
            } elseif ($disciplinasIdsProf->isNotEmpty()) {
                $turmas = $queryTurmasDocente->orderBy('nome_identificador')->get();
            } else {
                // Professor sem disciplinas nem turmas atribuídas não deve herdar dados fictícios ou globais
                $turmas = collect();
            }
        } else {
            // Especialistas e Administradores visualizam estritamente as turmas ativas do ano letivo em vigor
            $queryTurmasAdm = Turma::where('status', 'Ativa');
            if ($anoVigente) {
                $queryTurmasAdm->where('ano_letivo', $anoVigente);
            }
            $turmas = $queryTurmasAdm->orderBy('nome_identificador')->get();
            $disciplinasIdsProf = collect();
        }

        // Se nenhum período estiver ativo e nenhuma turma ativa existir, fallback geral apenas para gestão
        if ($turmas->isEmpty() && ! $anoVigente && ! $isDocenteEstrito) {
            $turmas = Turma::orderBy('nome_identificador')->get();
        }

        $turmasIdsList = $turmas->pluck('id_turma')->toArray();

        // 2. Calcula os indicadores por turma (Médias de notas e Frequências)
        $mediasTurmas = [];
        $frequenciasTurmas = [];
        $somaMediasTurmas = 0.0;
        $turmasComNota = 0;
        $somaFrequenciasTurmas = 0.0;
        $turmasComFrequencia = 0;

        foreach ($turmas as $turma) {
            // Consulta de notas da turma (filtrando disciplinas do docente e período letivo)
            $queryNotas = Nota::where('turma_id', $turma->id_turma);
            if ($isDocenteEstrito && $disciplinasIdsProf->isNotEmpty()) {
                $queryNotas->whereIn('disciplina_id', $disciplinasIdsProf);
            }
            if ($divisaoEfetiva && $divisaoEfetiva !== 'todos') {
                $queryNotas->where('periodo_letivo', $divisaoEfetiva);
            }
            $notas = $queryNotas->get();
            $mediaTurma = 0.0;

            if ($notas->isNotEmpty()) {
                // Converte cada avaliação proporcionalmente para a escala de 0 a 10
                $aproveitamentoTurma = $notas->map(function ($nota) {
                    $max = $nota->valor_maximo > 0 ? (float) $nota->valor_maximo : 10.0;

                    return ((float) $nota->valor_nota / $max) * 10;
                })->avg();

                $somaMediasTurmas += (float) $aproveitamentoTurma;
                $mediaTurma = round((float) $aproveitamentoTurma, 1);
                $turmasComNota++;
            }

            // Consulta de faltas e presenças da turma (compatível com chamadas regulares e diário CSV)
            $queryFreqBase = Frequencia::with('disciplina')->where('turma_id', $turma->id_turma);
            if ($isDocenteEstrito && $disciplinasIdsProf->isNotEmpty()) {
                $queryFreqBase->whereIn('disciplina_id', $disciplinasIdsProf);
            }
            $freqsTurmaBrutas = $queryFreqBase->get();
            $temOrigemCsvTurma = $freqsTurmaBrutas->contains(
                fn (Frequencia $f) => str_contains((string) $f->justificativa, 'via diário escolar')
            );

            if ($temOrigemCsvTurma) {
                // Lançamentos consolidados via CSV filtram pelo marcador de etapa ou calendário e projetam aulas previstas
                $freqsFiltradas = ($divisaoEfetiva && $divisaoEfetiva !== 'todos')
                    ? $freqsTurmaBrutas->filter(fn (Frequencia $f) => $this->pertenceAoPeriodoFrequencia($f, $divisaoEfetiva, $periodoAtivo))
                    : $freqsTurmaBrutas;

                $aulasTurma = 0;
                $faltasTurma = 0;
                foreach ($freqsFiltradas->groupBy(fn (Frequencia $f) => "{$f->usuario_id}_{$f->disciplina_id}") as $grupo) {
                    $faltasGrupo = (int) $grupo->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');
                    $aulasReg = (int) $grupo->sum('quantidade_aulas');
                    $csvGrupo = $grupo->contains(fn (Frequencia $f) => str_contains((string) $f->justificativa, 'via diário escolar'));

                    if (! $csvGrupo && $aulasReg > $faltasGrupo) {
                        $aulasGrupo = $aulasReg;
                    } else {
                        $etapasLancadas = max(1, $grupo->count());
                        $discObj = $grupo->first()?->disciplina;
                        $aulasEtapa = $discObj
                            ? $this->calcularAulasPrevistasDisciplina($discObj, $totalDivisoesPeriodo, false)
                            : max(15, (int) round(80 / $totalDivisoesPeriodo));
                        $aulasGrupo = max($faltasGrupo, $aulasEtapa * $etapasLancadas);
                    }
                    $faltasTurma += $faltasGrupo;
                    $aulasTurma += $aulasGrupo;
                }
            } else {
                $queryFreq = Frequencia::where('turma_id', $turma->id_turma);
                if ($isDocenteEstrito && $disciplinasIdsProf->isNotEmpty()) {
                    $queryFreq->whereIn('disciplina_id', $disciplinasIdsProf);
                }
                if ($divisaoEfetiva === 'todos') {
                    if ($periodoAtivo !== null && $periodoAtivo->data_inicio && $periodoAtivo->data_fim) {
                        $queryFreq->whereBetween('data_aula', [$periodoAtivo->data_inicio, $periodoAtivo->data_fim]);
                    }
                } elseif ($divisaoObjeto !== null && $divisaoObjeto->data_inicio && $divisaoObjeto->data_fim) {
                    $queryFreq->whereBetween('data_aula', [$divisaoObjeto->data_inicio, $divisaoObjeto->data_fim]);
                }
                $aulasTurma = (int) (clone $queryFreq)->sum('quantidade_aulas');
                $faltasTurma = (int) (clone $queryFreq)->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');
            }

            if ($notas->isNotEmpty()) {
                $mediasTurmas[] = [
                    'id' => $turma->id_turma,
                    'turma' => $turma->nome_identificador,
                    'nota' => $mediaTurma,
                ];
            }

            if ($aulasTurma > 0) {
                $presencaTurma = (1 - ($faltasTurma / $aulasTurma)) * 100;
                $somaFrequenciasTurmas += $presencaTurma;
                $turmasComFrequencia++;
                $frequenciasTurmas[] = [
                    'id' => $turma->id_turma,
                    'turma' => $turma->nome_identificador,
                    'percentual' => round($presencaTurma, 1),
                ];
            }
        }

        // 3. Consolidação dos KPIs Superiores
        // Total de alunos ativos distintos no escopo
        $totalAlunos = ! empty($turmasIdsList)
            ? Matricula::whereIn('turma_id', $turmasIdsList)
                ->where('status_matricula', 'Ativo')
                ->distinct('usuario_id')
                ->count('usuario_id')
            : 0;

        // Média geral agregada (escala 0-10)
        $mediaGeral = $turmasComNota > 0 ? round($somaMediasTurmas / $turmasComNota, 1) : 0.0;

        // A média aritmética dá o mesmo peso a cada turma com registros no período.
        $frequenciaMediaPercentual = $turmasComFrequencia > 0
            ? round($somaFrequenciasTurmas / $turmasComFrequencia, 1)
            : null;

        // Total de notícias publicadas no sistema
        $noticiasCount = Noticia::count();

        $ultimasNotificacoes = $this->obterUltimasNotificacoes();

        // Nomes e detalhes das disciplinas sob regência do docente ou catálogo institucional na simulação Adm/Especialista
        if ($isDocenteEstrito) {
            $disciplinasDocenteColecao = $disciplinasIdsProf->isNotEmpty()
                ? Disciplina::with(['ciclos', 'turmas' => fn ($q) => $q->withCount('alunos')])
                    ->whereIn('id_disciplina', $disciplinasIdsProf)
                    ->orderBy('nome')
                    ->get()
                : collect();
        } else {
            // Sincroniza herança de ciclos das disciplinas institucionais para visão consultiva/simulação
            Disciplina::with('ciclos.turmas')->get()->each(fn (Disciplina $disc) => $disc->sincronizarComTurmasDosCiclos());
            $disciplinasDocenteColecao = Disciplina::with(['ciclos', 'turmas' => fn ($q) => $q->withCount('alunos')])
                ->orderBy('nome')
                ->get();
        }

        $disciplinasDocenteNomes = $disciplinasDocenteColecao->pluck('nome')->values()->toArray();
        $disciplinasDetalhadas = $disciplinasDocenteColecao->map(function (Disciplina $d) use (
            $turmas,
            $turmasIdsList,
            $divisaoEfetiva,
            $divisaoObjeto,
            $periodoAtivo,
            $pontosDivisao,
            $totalDivisoesPeriodo,
            $isDocenteEstrito
        ) {
            $turmasVinculadas = $d->turmas->whereIn('id_turma', $turmasIdsList)->values();
            if ($turmasVinculadas->isEmpty() && ! empty($turmasIdsList)) {
                // Fallback real caso haja notas/frequências lançadas diretamente na disciplina sem vínculo prévio de ciclo
                $turmasComLancamentoIds = Nota::whereIn('turma_id', $turmasIdsList)
                    ->where('disciplina_id', $d->id_disciplina)
                    ->pluck('turma_id')
                    ->merge(
                        Frequencia::whereIn('turma_id', $turmasIdsList)
                            ->where('disciplina_id', $d->id_disciplina)
                            ->pluck('turma_id')
                    )
                    ->unique();
                $turmasVinculadas = $turmas->whereIn('id_turma', $turmasComLancamentoIds)->values();
            }

            $turmasIdsDaDisciplina = $turmasVinculadas->pluck('id_turma')->values();

            // Calcula médias e frequências específicas DESTA disciplina em cada turma vinculada
            $mediasDaDisciplina = [];
            $frequenciasDaDisciplina = [];
            $aulasEtapaDisciplina = $this->calcularAulasPrevistasDisciplina($d, $totalDivisoesPeriodo, false);

            foreach ($turmasVinculadas as $turmaDisc) {
                $qNotasDiscTurma = Nota::where('turma_id', $turmaDisc->id_turma)
                    ->where('disciplina_id', $d->id_disciplina);
                if ($divisaoEfetiva && $divisaoEfetiva !== 'todos') {
                    $qNotasDiscTurma->where('periodo_letivo', $divisaoEfetiva);
                }
                $notasDiscTurma = $qNotasDiscTurma->get();

                if ($notasDiscTurma->isNotEmpty()) {
                    $aproveitamento10 = (float) $notasDiscTurma->map(function ($nota) use ($pontosDivisao) {
                        $max = $nota->valor_maximo > 0 ? (float) $nota->valor_maximo : $pontosDivisao;

                        return ((float) $nota->valor_nota / max(1.0, $max)) * 10;
                    })->avg();

                    $mediasDaDisciplina[] = [
                        'id' => $turmaDisc->id_turma,
                        'turma' => $turmaDisc->nome_identificador,
                        'nota' => round($aproveitamento10, 1),
                        'aproveitamento' => round($aproveitamento10 * 10, 1),
                    ];
                }

                $freqsDiscBrutas = Frequencia::where('turma_id', $turmaDisc->id_turma)
                    ->where('disciplina_id', $d->id_disciplina)
                    ->get();
                $csvDiscTurma = $freqsDiscBrutas->contains(
                    fn (Frequencia $f) => str_contains((string) $f->justificativa, 'via diário escolar')
                );

                if ($csvDiscTurma) {
                    $freqsDiscFiltradas = ($divisaoEfetiva && $divisaoEfetiva !== 'todos')
                        ? $freqsDiscBrutas->filter(fn (Frequencia $f) => $this->pertenceAoPeriodoFrequencia($f, $divisaoEfetiva, $periodoAtivo))
                        : $freqsDiscBrutas;

                    $aulasDisc = 0;
                    $faltasDisc = 0;
                    foreach ($freqsDiscFiltradas->groupBy('usuario_id') as $grupoAluno) {
                        $faltasAl = (int) $grupoAluno->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');
                        $etapasAl = max(1, $grupoAluno->count());
                        $aulasDisc += max($faltasAl, $aulasEtapaDisciplina * $etapasAl);
                        $faltasDisc += $faltasAl;
                    }
                } else {
                    $qFreqDisc = Frequencia::where('turma_id', $turmaDisc->id_turma)
                        ->where('disciplina_id', $d->id_disciplina);
                    if ($divisaoEfetiva === 'todos') {
                        if ($periodoAtivo !== null && $periodoAtivo->data_inicio && $periodoAtivo->data_fim) {
                            $qFreqDisc->whereBetween('data_aula', [$periodoAtivo->data_inicio, $periodoAtivo->data_fim]);
                        }
                    } elseif ($divisaoObjeto !== null && $divisaoObjeto->data_inicio && $divisaoObjeto->data_fim) {
                        $qFreqDisc->whereBetween('data_aula', [$divisaoObjeto->data_inicio, $divisaoObjeto->data_fim]);
                    }
                    $aulasDisc = (int) (clone $qFreqDisc)->sum('quantidade_aulas');
                    $faltasDisc = (int) (clone $qFreqDisc)->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');
                }

                if ($aulasDisc > 0) {
                    $frequenciasDaDisciplina[] = [
                        'id' => $turmaDisc->id_turma,
                        'turma' => $turmaDisc->nome_identificador,
                        'percentual' => round((1 - ($faltasDisc / $aulasDisc)) * 100, 1),
                    ];
                }
            }

            // Consulta alunos matriculados ativos nessas turmas para apuração de risco na disciplina
            $matriculas = $turmasIdsDaDisciplina->isNotEmpty()
                ? Matricula::with('aluno')
                    ->whereIn('turma_id', $turmasIdsDaDisciplina)
                    ->where('status_matricula', 'Ativo')
                    ->get()
                : collect();

            $alunosPorNota = [];
            $alunosPorFreq = [];

            foreach ($matriculas as $mat) {
                $aluno = $mat->aluno;
                if (! $aluno) {
                    continue;
                }

                // Consulta de notas na disciplina somando proporcionalmente etapas selecionadas
                $qNota = Nota::where('turma_id', $mat->turma_id)
                    ->where('disciplina_id', $d->id_disciplina)
                    ->where('usuario_id', $aluno->id);
                if ($divisaoEfetiva && $divisaoEfetiva !== 'todos') {
                    $qNota->where('periodo_letivo', $divisaoEfetiva);
                }
                $notasAluno = $qNota->get();

                if ($notasAluno->isNotEmpty()) {
                    $somaNotasAluno = (float) $notasAluno->sum('valor_nota');
                    $somaMaxAluno = (float) $notasAluno->sum(fn ($n) => $n->valor_maximo > 0 ? (float) $n->valor_maximo : $pontosDivisao);
                    if ($somaMaxAluno > 0) {
                        $percentualNota = ($somaNotasAluno / $somaMaxAluno) * 100;
                        if ($percentualNota < 60.0) {
                            $turmaRef = $turmasVinculadas->firstWhere('id_turma', $mat->turma_id);
                            $turmaNome = $turmaRef ? $turmaRef->nome_identificador : 'Turma';
                            $alunosPorNota[] = [
                                'id' => "nota-{$aluno->id}-{$d->id_disciplina}",
                                'nome' => $aluno->name,
                                'turma' => $turmaNome,
                                'mediaAtual' => round($percentualNota, 1),
                            ];
                        }
                    }
                }

                // Consulta de frequência na disciplina respeitando a etapa avaliativa e origem CSV
                $freqsAlunoBrutas = Frequencia::where('turma_id', $mat->turma_id)
                    ->where('disciplina_id', $d->id_disciplina)
                    ->where('usuario_id', $aluno->id)
                    ->get();
                $csvAluno = $freqsAlunoBrutas->contains(
                    fn (Frequencia $f) => str_contains((string) $f->justificativa, 'via diário escolar')
                );

                if ($csvAluno) {
                    $freqsAlunoFiltradas = ($divisaoEfetiva && $divisaoEfetiva !== 'todos')
                        ? $freqsAlunoBrutas->filter(fn (Frequencia $f) => $this->pertenceAoPeriodoFrequencia($f, $divisaoEfetiva, $periodoAtivo))
                        : $freqsAlunoBrutas;
                    $faltas = (int) $freqsAlunoFiltradas->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');
                    $aulas = $freqsAlunoFiltradas->isNotEmpty()
                        ? max($faltas, $aulasEtapaDisciplina * max(1, $freqsAlunoFiltradas->count()))
                        : 0;
                } else {
                    $qFreq = Frequencia::where('turma_id', $mat->turma_id)
                        ->where('disciplina_id', $d->id_disciplina)
                        ->where('usuario_id', $aluno->id);
                    if ($divisaoEfetiva === 'todos') {
                        if ($periodoAtivo !== null && $periodoAtivo->data_inicio && $periodoAtivo->data_fim) {
                            $qFreq->whereBetween('data_aula', [$periodoAtivo->data_inicio, $periodoAtivo->data_fim]);
                        }
                    } elseif ($divisaoObjeto !== null && $divisaoObjeto->data_inicio && $divisaoObjeto->data_fim) {
                        $qFreq->whereBetween('data_aula', [$divisaoObjeto->data_inicio, $divisaoObjeto->data_fim]);
                    }
                    $aulas = (int) (clone $qFreq)->sum('quantidade_aulas');
                    $faltas = (int) (clone $qFreq)->whereIn('status_presenca', ['Falta', 'Falta Justificada'])->sum('quantidade_aulas');
                }

                if ($aulas > 0) {
                    $percentualPresenca = (1 - ($faltas / $aulas)) * 100;
                    if ($percentualPresenca < 75.0) {
                        $turmaRef = $turmasVinculadas->firstWhere('id_turma', $mat->turma_id);
                        $turmaNome = $turmaRef ? $turmaRef->nome_identificador : 'Turma';
                        $alunosPorFreq[] = [
                            'id' => "freq-{$aluno->id}-{$d->id_disciplina}",
                            'nome' => $aluno->name,
                            'turma' => $turmaNome,
                            'frequenciaAtual' => round($percentualPresenca, 1),
                        ];
                    }
                }
            }

            return [
                'id_disciplina' => $d->id_disciplina,
                'nome' => $d->nome,
                'aulas_semanais' => $d->aulas_semanais,
                'carga_horaria_anual' => $d->carga_horaria_anual,
                'ciclos' => $d->ciclos->pluck('nome')->values()->all(),
                'modo_simulacao' => ! $isDocenteEstrito,
                'turmas' => $turmasVinculadas->map(fn ($t) => [
                    'id_turma' => $t->id_turma,
                    'nome_identificador' => $t->nome_identificador,
                    'total_alunos' => $t->alunos_count ?? 0,
                ])->values()->all(),
                'medias' => $mediasDaDisciplina,
                'frequencias' => $frequenciasDaDisciplina,
                'risco' => [
                    'alunosAbaixoDaMedia' => count($alunosPorNota),
                    'alunosComFrequenciaInsuficiente' => count($alunosPorFreq),
                    'alunosPorNota' => $alunosPorNota,
                    'alunosPorFrequencia' => $alunosPorFreq,
                ],
            ];
        })->values()->toArray();

        return [
            'kpis' => [
                'total_alunos' => $totalAlunos,
                'media_geral' => $turmasComNota > 0 ? $mediaGeral : null,
                'frequencia_media' => $frequenciaMediaPercentual !== null ? "{$frequenciaMediaPercentual}%" : null,
                'noticias_publicadas' => $noticiasCount,
                'total_turmas' => count($turmas),
            ],
            'resumo_turmas' => [
                'medias' => $mediasTurmas,
                'frequencias' => $frequenciasTurmas,
            ],
            'disciplinas_docente' => $disciplinasDocenteNomes,
            'disciplinas_detalhadas' => $disciplinasDetalhadas,
            'ultimas_notificacoes' => $ultimasNotificacoes,
            'periodo_contexto' => [
                'ano' => $periodoAtivo !== null ? $periodoAtivo->ano : (int) date('Y'),
                'tipo_divisao' => $periodoAtivo !== null ? $periodoAtivo->tipo_divisao : 'trimestre',
                'divisao_selecionada' => $divisaoEfetiva,
                'pontos_divisao' => $pontosDivisao,
                'pontos_consolidados' => (float) $pontosConsolidados,
                'data_inicio' => $periodoAtivo?->data_inicio ? Carbon::parse($periodoAtivo->data_inicio)->format('Y-m-d') : null,
                'data_fim' => $periodoAtivo?->data_fim ? Carbon::parse($periodoAtivo->data_fim)->format('Y-m-d') : null,
                'divisoes_disponiveis' => $periodoAtivo?->divisoes->map(fn ($div) => [
                    'id_divisao' => $div->id_divisao,
                    'nome' => $div->nome,
                    'pontos' => (float) $div->pontos,
                    'is_atual' => $div->isVigente(),
                    'data_inicio' => $div->data_inicio ? Carbon::parse($div->data_inicio)->format('Y-m-d') : null,
                    'data_fim' => $div->data_fim ? Carbon::parse($div->data_fim)->format('Y-m-d') : null,
                ])->values()->all() ?? [],
            ],
        ];
    }

    /**
     * Agrupa as cópias por destinatário para exibir cada notificação uma única vez.
     *
     * @return array<int, array<string, mixed>>
     */
    private function obterUltimasNotificacoes(): array
    {
        $autoresIds = User::query()
            ->whereIn('role', [
                UserRole::PROFESSOR->value,
                UserRole::ESPECIALISTA->value,
                UserRole::ADM->value,
                'admin',
                UserRole::BIBLIOTECARIA->value,
                'bibliotecario',
            ])
            ->pluck('id');
        $bibliotecariasIds = User::query()
            ->whereIn('role', [UserRole::BIBLIOTECARIA->value, 'bibliotecario'])
            ->pluck('id');

        $eventos = DatabaseNotification::query()
            ->where('type', NotificacaoPortal::class)
            ->whereNotNull('data->event_key')
            ->where(function ($query) use ($autoresIds, $bibliotecariasIds) {
                $query->where(function ($query) use ($autoresIds) {
                    $query->where('data->tipo', 'manual')
                        ->whereIn('data->criador_id', $autoresIds);
                })->orWhere(function ($query) use ($bibliotecariasIds) {
                    $query->where('notifiable_type', User::class)
                        ->whereIn('notifiable_id', $bibliotecariasIds);
                });
            })
            ->selectRaw("MAX(id) as id, MAX(created_at) as created_at, json_extract(data, '$.event_key') as event_key")
            ->groupByRaw("json_extract(data, '$.event_key')")
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $notificacoes = DatabaseNotification::query()
            ->whereIn('id', $eventos->pluck('id'))
            ->get()
            ->keyBy('id');

        return $eventos->map(function ($evento) use ($notificacoes) {
            $notificacao = $notificacoes->get($evento->id);
            $dados = $notificacao?->data ?? [];
            $titulo = $dados['titulo'] ?? 'Notificação escolar';
            $criador = $dados['criador_nome'] ?? 'Sistema';

            return [
                'id' => (string) $evento->event_key,
                'tipo' => 'notificacao',
                'texto' => "{$criador}: {$titulo}",
                'assunto' => $dados['assunto'] ?? '',
                'tempoAtras' => $notificacao?->created_at
                    ? $notificacao->created_at->locale('pt_BR')->diffForHumans()
                    : 'recentemente',
            ];
        })->all();
    }
}
