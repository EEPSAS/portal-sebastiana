<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Data;

/**
 * Envelope raiz de retorno da importação de CSV consolidado (RelatorioImportadoResource).
 * Espelhado 1:1 com RelatorioImportadoSchema (Zod) no frontend.
 */
class RelatorioImportadoData extends Data
{
    /**
     * @param  array{id_turma: int|null, nome_identificador: string|null}  $turma
     * @param  array<int, array<string, mixed>>  $ambiguidades
     * @param  array<int, array<string, mixed>>  $divergencias
     * @param  array<int, array<string, mixed>>  $disciplinas_pendentes
     * @param  array<int, array<string, mixed>>  $catalogo_disciplinas
     */
    public function __construct(
        public string $status,
        public ?string $tipo_pendencia,
        public string $message,
        public array $turma,
        public array $ambiguidades,
        public array $divergencias,
        public array $disciplinas_pendentes,
        public array $catalogo_disciplinas,
        public ResumoDadosRelatorioCsvData $dados,
    ) {}

    /**
     * Constrói e tipa o envelope completo a partir do array produzido pelo serviço pedagógico.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function fromResultado(array $payload, string $mensagemPadrao = 'Relatório da turma importado e sincronizado com sucesso.'): self
    {
        $dadosBrutos = is_array($payload['dados'] ?? null) ? $payload['dados'] : [];

        $status = (string) ($payload['status'] ?? $dadosBrutos['status'] ?? 'sucesso');
        $tipoPendencia = $payload['tipo_pendencia'] ?? $dadosBrutos['tipo_pendencia'] ?? null;
        $message = (string) ($payload['message'] ?? $dadosBrutos['message'] ?? $mensagemPadrao);

        $ambiguidades = array_map(
            fn (array $item) => (new AmbiguidadeAlunoCsvData(
                nome_csv: (string) ($item['nome_csv'] ?? ''),
                candidatos: array_map(fn (array $c) => [
                    'id' => (int) ($c['id'] ?? 0),
                    'name' => (string) ($c['name'] ?? ''),
                    'email' => (string) ($c['email'] ?? ''),
                    'ja_matriculado' => (bool) ($c['ja_matriculado'] ?? false),
                ], array_values($item['candidatos'] ?? [])),
            ))->toArray(),
            array_values($payload['ambiguidades'] ?? $dadosBrutos['ambiguidades'] ?? [])
        );

        $divergencias = array_map(
            fn (array $div) => (new DivergenciaNotaCsvData(
                usuario_id: (int) ($div['usuario_id'] ?? 0),
                nome_aluno: (string) ($div['nome_aluno'] ?? ''),
                disciplina_id: (int) ($div['disciplina_id'] ?? 0),
                nome_disciplina: (string) ($div['nome_disciplina'] ?? ''),
                periodo_letivo: (string) ($div['periodo_letivo'] ?? ''),
                nota_atual: round((float) ($div['nota_atual'] ?? 0.0), 2),
                nova_nota: round((float) ($div['nova_nota'] ?? 0.0), 2),
                tipo_divergencia: (string) ($div['tipo_divergencia'] ?? 'nota'),
                faltas_atuais: array_key_exists('faltas_atuais', $div) && $div['faltas_atuais'] !== null
                    ? (int) $div['faltas_atuais']
                    : null,
                novas_faltas: array_key_exists('novas_faltas', $div) && $div['novas_faltas'] !== null
                    ? (int) $div['novas_faltas']
                    : null,
            ))->toArray(),
            array_values($payload['divergencias'] ?? $dadosBrutos['divergencias'] ?? [])
        );

        $disciplinasPendentes = array_map(
            fn (array $disc) => (new DisciplinaPendenteCsvData(
                nome_csv: (string) ($disc['nome_csv'] ?? ''),
                sugestao_disciplina_id: isset($disc['sugestao_disciplina_id']) ? (int) $disc['sugestao_disciplina_id'] : null,
                sugestao_disciplina_nome: isset($disc['sugestao_disciplina_nome']) ? (string) $disc['sugestao_disciplina_nome'] : null,
            ))->toArray(),
            array_values($payload['disciplinas_pendentes'] ?? $dadosBrutos['disciplinas_pendentes'] ?? [])
        );

        // Catálogo restrito às disciplinas já vinculadas à turma alvo para eventual correlação manual de colunas
        $catalogoDisciplinas = array_values(array_map(
            fn ($d) => is_array($d) ? $d : (is_object($d) && method_exists($d, 'toArray') ? $d->toArray() : (array) $d),
            $payload['catalogo_disciplinas'] ?? $dadosBrutos['catalogo_disciplinas'] ?? []
        ));

        $ignorados = array_values(array_map(function (array $ig): array {
            if (array_key_exists('email', $ig)) {
                return [
                    'nome_csv' => (string) ($ig['nome_csv'] ?? ''),
                    'motivo' => (string) ($ig['motivo'] ?? ''),
                    'email' => $ig['email'] !== null ? (string) $ig['email'] : null,
                ];
            }

            return [
                'nome_csv' => (string) ($ig['nome_csv'] ?? ''),
                'motivo' => (string) ($ig['motivo'] ?? ''),
            ];
        }, $dadosBrutos['alunos_ignorados'] ?? []));

        $resumoDados = new ResumoDadosRelatorioCsvData(
            status: $status,
            tipo_pendencia: $tipoPendencia !== null ? (string) $tipoPendencia : null,
            message: $message,
            linhas_lidas: (int) ($dadosBrutos['linhas_lidas'] ?? 0),
            periodo_aplicado: isset($dadosBrutos['periodo_aplicado']) ? (string) $dadosBrutos['periodo_aplicado'] : null,
            data_referencia: isset($dadosBrutos['data_referencia']) ? (string) $dadosBrutos['data_referencia'] : null,
            alunos_identificados: (int) ($dadosBrutos['alunos_identificados'] ?? 0),
            alunos_ignorados: $ignorados,
            total_ignorados: (int) ($dadosBrutos['total_ignorados'] ?? count($ignorados)),
            notas_sincronizadas: (int) ($dadosBrutos['notas_sincronizadas'] ?? 0),
            frequencias_sincronizadas: (int) ($dadosBrutos['frequencias_sincronizadas'] ?? 0),
            alertas: array_values(array_map('strval', $dadosBrutos['alertas'] ?? [])),
        );

        return new self(
            status: $status,
            tipo_pendencia: $tipoPendencia !== null ? (string) $tipoPendencia : null,
            message: $message,
            turma: [
                'id_turma' => isset($payload['turma']['id_turma']) ? (int) $payload['turma']['id_turma'] : null,
                'nome_identificador' => isset($payload['turma']['nome_identificador']) ? (string) $payload['turma']['nome_identificador'] : null,
            ],
            ambiguidades: $ambiguidades,
            divergencias: $divergencias,
            disciplinas_pendentes: $disciplinasPendentes,
            catalogo_disciplinas: $catalogoDisciplinas,
            dados: $resumoDados,
        );
    }
}
