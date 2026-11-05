<?php

namespace App\Data\Academico;

use App\Models\Turma;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Data Object de saída padronizada da Turma Escolar, espelhado 1:1 com TurmaSchema (Zod) e apiContract.md.
 */
class TurmaData extends Data
{
    public function __construct(
        public int $id_turma,
        public string $nome_identificador,
        public ?int $ciclo_id,
        public ?string $ciclo_nome,
        public ?int $periodo_letivo_id,
        public int $ano_letivo,
        public string $turno,
        public int $capacidade_maxima,
        public string $status,
        public int|Optional $total_alunos,
        public int|Optional $total_disciplinas,
    ) {}

    /**
     * Constrói o DTO tipado a partir do Model Eloquent Turma, preservando semântica de whenCounted.
     */
    public static function fromModel(Turma $turma): self
    {
        $periodoId = $turma->periodo_letivo_id !== null
            ? (int) $turma->periodo_letivo_id
            : ($turma->relationLoaded('periodoLetivo') && $turma->periodoLetivo
                ? (int) $turma->periodoLetivo->id_periodo_letivo
                : null);

        return new self(
            id_turma: (int) $turma->id_turma,
            nome_identificador: (string) $turma->nome_identificador,
            ciclo_id: $turma->ciclo_id !== null ? (int) $turma->ciclo_id : null,
            ciclo_nome: $turma->relationLoaded('ciclo') ? $turma->ciclo?->nome : null,
            periodo_letivo_id: $periodoId,
            ano_letivo: (int) $turma->ano_letivo,
            turno: (string) ($turma->turno ?? 'Integral'),
            capacidade_maxima: (int) ($turma->capacidade_maxima ?? 40),
            status: (string) ($turma->status ?? 'Ativa'),
            total_alunos: $turma->alunos_count !== null ? (int) $turma->alunos_count : Optional::create(),
            total_disciplinas: $turma->disciplinas_count !== null ? (int) $turma->disciplinas_count : Optional::create(),
        );
    }
}
