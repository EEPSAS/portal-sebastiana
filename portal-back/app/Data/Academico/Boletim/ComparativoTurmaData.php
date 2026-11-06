<?php

namespace App\Data\Academico\Boletim;

use Spatie\LaravelData\Data;

/**
 * Data Object raiz do Comparativo Aluno vs Turma (ComparativoTurmaResource).
 * Espelhado 1:1 com ComparativoTurmaSchema em boletimService.js.
 */
class ComparativoTurmaData extends Data
{
    /**
     * @param  array<int, array<string, mixed>>  $comparativo
     * @param  array{labels: array<int, string>, series: array<int, array<string, mixed>>}  $radar
     */
    public function __construct(
        public int $turma_id,
        public int $aluno_id,
        public string $periodo_selecionado,
        public ?float $frequencia_aluno_global,
        public ?float $frequencia_turma_global,
        public array $comparativo,
        public array $radar,
    ) {}

    /**
     * Constrói e tipa o comparativo a partir do array produzido por AlunoDashboardService.
     *
     * @param  array<string, mixed>  $dados
     */
    public static function fromServiceArray(array $dados): self
    {
        $itens = array_map(
            fn (array $item) => (new ItemComparativoTurmaData(
                disciplina_id: (int) ($item['disciplina_id'] ?? 0),
                nome_disciplina: (string) ($item['nome_disciplina'] ?? ''),
                nota_aluno: round((float) ($item['nota_aluno'] ?? 0.0), 2),
                faltas_aluno: (int) ($item['faltas_aluno'] ?? 0),
                frequencia_aluno: isset($item['frequencia_aluno']) && $item['frequencia_aluno'] !== null
                    ? round((float) $item['frequencia_aluno'], 1)
                    : null,
                media_turma: round((float) ($item['media_turma'] ?? 0.0), 2),
                media_faltas_turma: round((float) ($item['media_faltas_turma'] ?? 0.0), 2),
                frequencia_turma: isset($item['frequencia_turma']) && $item['frequencia_turma'] !== null
                    ? round((float) $item['frequencia_turma'], 1)
                    : null,
                valor_maximo: round((float) ($item['valor_maximo'] ?? 30.0), 2),
            ))->toArray(),
            array_values($dados['comparativo'] ?? [])
        );

        $radarRaw = is_array($dados['radar'] ?? null) ? $dados['radar'] : [];
        $radar = [
            'labels' => array_values(array_map('strval', $radarRaw['labels'] ?? [])),
            'series' => array_values(array_map(fn (array $s) => [
                'name' => (string) ($s['name'] ?? ''),
                'data' => array_values(array_map('floatval', $s['data'] ?? [])),
                'faltas' => array_values(array_map(fn ($f) => is_int($f) ? $f : (float) $f, $s['faltas'] ?? [])),
            ], $radarRaw['series'] ?? [])),
        ];

        return new self(
            turma_id: (int) ($dados['turma_id'] ?? 0),
            aluno_id: (int) ($dados['aluno_id'] ?? 0),
            periodo_selecionado: (string) ($dados['periodo_selecionado'] ?? 'Consolidado Anual'),
            frequencia_aluno_global: isset($dados['frequencia_aluno_global']) && $dados['frequencia_aluno_global'] !== null
                ? round((float) $dados['frequencia_aluno_global'], 1)
                : null,
            frequencia_turma_global: isset($dados['frequencia_turma_global']) && $dados['frequencia_turma_global'] !== null
                ? round((float) $dados['frequencia_turma_global'], 1)
                : null,
            comparativo: $itens,
            radar: $radar,
        );
    }
}
