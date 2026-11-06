<?php

namespace App\Data\Academico;

use App\Models\Nota;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Data Object de saída do lançamento de nota e frequência consolidada no Diário Escolar.
 * Espelhado 1:1 com NotaDiarioSchema (Zod) e apiContract.md.
 */
class NotaDiarioData extends Data
{
    public function __construct(
        public int $id_nota,
        public int $turma_id,
        public int $disciplina_id,
        public int $usuario_id,
        public string $periodo_letivo,
        public ?string $tipo_avaliacao,
        public float $valor_nota,
        public float $valor_maximo,
        public float $valor_maximo_periodo,
        public ?float $percentual_faltas,
        public ?int $total_faltas,
        public string $situacao,
        public ?string $data_registro,
        public ?string $observacoes,
        public AlunoNotaResumoData|Optional $aluno,
        public DisciplinaNotaResumoData|Optional $disciplina,
    ) {}

    /**
     * Constrói o DTO tipado a partir do Model Nota já enriquecido com métricas de falta e período.
     */
    public static function fromModel(Nota $nota): self
    {
        $valorNota = (float) $nota->valor_nota;
        $valorMax = (float) ($nota->valor_maximo ?? 10.0);
        $valorMaxPeriodo = (float) ($nota->valor_maximo_periodo ?? $valorMax ?: 10.0);

        // Classificação automática da situação caso ainda não tenha sido atribuída
        $proporcao = $valorMaxPeriodo > 0 ? ($valorNota / $valorMaxPeriodo) : 0.0;
        $situacaoPadrao = $proporcao >= 0.8
            ? 'Acima da Média'
            : ($proporcao >= 0.6 ? 'Na Média' : 'Abaixo da Média');

        $dataFormatada = null;
        if ($nota->data_registro) {
            $dataFormatada = $nota->data_registro instanceof \DateTimeInterface
                ? $nota->data_registro->format('Y-m-d')
                : substr((string) $nota->data_registro, 0, 10);
        }

        return new self(
            id_nota: (int) $nota->id_nota,
            turma_id: (int) $nota->turma_id,
            disciplina_id: (int) $nota->disciplina_id,
            usuario_id: (int) $nota->usuario_id,
            periodo_letivo: (string) ($nota->periodo_letivo ?? ''),
            tipo_avaliacao: $nota->tipo_avaliacao !== null ? (string) $nota->tipo_avaliacao : null,
            valor_nota: $valorNota,
            valor_maximo: $valorMax,
            valor_maximo_periodo: $valorMaxPeriodo,
            percentual_faltas: isset($nota->percentual_faltas) ? (float) $nota->percentual_faltas : null,
            total_faltas: isset($nota->total_faltas) ? (int) $nota->total_faltas : null,
            situacao: (string) ($nota->situacao ?? $situacaoPadrao),
            data_registro: $dataFormatada,
            observacoes: $nota->observacoes !== null ? (string) $nota->observacoes : null,
            aluno: $nota->relationLoaded('aluno') && $nota->aluno
                ? new AlunoNotaResumoData(
                    id: (int) $nota->aluno->id,
                    name: (string) $nota->aluno->name,
                    email: (string) $nota->aluno->email,
                )
                : Optional::create(),
            disciplina: $nota->relationLoaded('disciplina') && $nota->disciplina
                ? new DisciplinaNotaResumoData(
                    id_disciplina: (int) $nota->disciplina->id_disciplina,
                    nome: (string) $nota->disciplina->nome,
                )
                : Optional::create(),
        );
    }
}
