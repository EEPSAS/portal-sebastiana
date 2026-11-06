<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Data;

/**
 * Sub-envelope estatístico detalhado (`dados`) retornado após cada etapa de processamento do CSV.
 */
class ResumoDadosRelatorioCsvData extends Data
{
    /**
     * @param  array<int, array{nome_csv: string, motivo: string, email?: string|null}>  $alunos_ignorados
     * @param  array<int, string>  $alertas
     */
    public function __construct(
        public string $status,
        public ?string $tipo_pendencia,
        public string $message,
        public int $linhas_lidas,
        public ?string $periodo_aplicado,
        public ?string $data_referencia,
        public int $alunos_identificados,
        public array $alunos_ignorados,
        public int $total_ignorados,
        public int $notas_sincronizadas,
        public int $frequencias_sincronizadas,
        public array $alertas,
    ) {}
}
