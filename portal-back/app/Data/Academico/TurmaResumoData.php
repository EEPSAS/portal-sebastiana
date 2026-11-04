<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Data;

/**
 * Data Object para o resumo gerencial e analítico de cada turma escolar.
 * Blindado em paridade 1:1 com TurmaResumoSchema (Zod) no frontend.
 */
class TurmaResumoData extends Data
{
    public function __construct(
        public int $id_turma,
        public string $nome_identificador,
        public ?int $ciclo_id,
        public ?string $ciclo_nome,
        public string $turno,
        public int $ano_letivo,
        public string $status,
        public int $total_alunos,
        public float $media_geral,
        public float $taxa_presenca,
        public float $taxa_absenteismo,
        public int $total_avaliados,
        public DistribuicaoDesempenhoData $distribuicao,
    ) {}

    /**
     * Normaliza um array agregado do serviço analítico em um Data Object estritamente tipado.
     *
     * @param  array<string, mixed>  $dados
     */
    public static function fromResumoArray(array $dados): self
    {
        $distRaw = $dados['distribuicao'] ?? [];

        return new self(
            id_turma: (int) $dados['id_turma'],
            nome_identificador: (string) ($dados['nome_identificador'] ?? ''),
            ciclo_id: isset($dados['ciclo_id']) ? (int) $dados['ciclo_id'] : null,
            ciclo_nome: isset($dados['ciclo_nome']) ? (string) $dados['ciclo_nome'] : null,
            turno: (string) ($dados['turno'] ?? 'Integral'),
            ano_letivo: (int) ($dados['ano_letivo'] ?? (int) date('Y')),
            status: (string) ($dados['status'] ?? 'Ativa'),
            total_alunos: (int) ($dados['total_alunos'] ?? 0),
            media_geral: round((float) ($dados['media_geral'] ?? 0.0), 2),
            taxa_presenca: round((float) ($dados['taxa_presenca'] ?? 0.0), 1),
            taxa_absenteismo: round((float) ($dados['taxa_absenteismo'] ?? 0.0), 1),
            total_avaliados: (int) ($dados['total_avaliados'] ?? 0),
            distribuicao: new DistribuicaoDesempenhoData(
                acima: round((float) ($distRaw['acima'] ?? 0.0), 1),
                na_media: round((float) ($distRaw['na_media'] ?? 0.0), 1),
                abaixo: round((float) ($distRaw['abaixo'] ?? 0.0), 1),
            ),
        );
    }
}
