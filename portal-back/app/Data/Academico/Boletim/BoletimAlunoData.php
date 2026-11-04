<?php

namespace App\Data\Academico\Boletim;

use Spatie\LaravelData\Data;

/**
 * Data Object raiz do Boletim Escolar do Aluno (BoletimResource).
 * Espelhado 1:1 com BoletimAlunoSchema em boletimService.js.
 */
class BoletimAlunoData extends Data
{
    /**
     * @param  array<int, array<string, mixed>>  $boletim
     * @param  array<int, array<string, mixed>>  $grafico_boletim
     */
    public function __construct(
        public int $turma_id,
        public int $aluno_id,
        public string $periodo_selecionado,
        public array $boletim,
        public array $grafico_boletim,
    ) {}

    /**
     * Constrói e tipa o Boletim do Aluno a partir do array retornado por AlunoDashboardService.
     *
     * @param  array<string, mixed>  $dados
     */
    public static function fromServiceArray(array $dados): self
    {
        $itensBoletim = array_map(
            fn (array $item) => (new ItemBoletimAlunoData(
                disciplina_id: (int) ($item['disciplina_id'] ?? 0),
                nome_disciplina: (string) ($item['nome_disciplina'] ?? ''),
                nota_obtida: round((float) ($item['nota_obtida'] ?? 0.0), 2),
                valor_maximo: round((float) ($item['valor_maximo'] ?? 30.0), 2),
                somatorio_faltas: (int) ($item['somatorio_faltas'] ?? 0),
                total_aulas: (int) ($item['total_aulas'] ?? 0),
                status: (string) ($item['status'] ?? 'Aprovado'),
                id: (int) ($item['id'] ?? $item['disciplina_id'] ?? 0),
                materia: (string) ($item['materia'] ?? $item['nome_disciplina'] ?? ''),
                pontos: round((float) ($item['pontos'] ?? $item['nota_obtida'] ?? 0.0), 2),
                cor: (string) ($item['cor'] ?? '#0d6efd'),
            ))->toArray(),
            array_values($dados['boletim'] ?? [])
        );

        $itensGrafico = array_map(
            fn (array $g) => (new ItemGraficoBoletimData(
                id: (int) ($g['id'] ?? 0),
                materia: (string) ($g['materia'] ?? ''),
                pontos: round((float) ($g['pontos'] ?? 0.0), 2),
                cor: (string) ($g['cor'] ?? '#0d6efd'),
            ))->toArray(),
            array_values($dados['grafico_boletim'] ?? [])
        );

        return new self(
            turma_id: (int) ($dados['turma_id'] ?? 0),
            aluno_id: (int) ($dados['aluno_id'] ?? 0),
            periodo_selecionado: (string) ($dados['periodo_selecionado'] ?? 'Consolidado Anual'),
            boletim: $itensBoletim,
            grafico_boletim: $itensGrafico,
        );
    }
}
