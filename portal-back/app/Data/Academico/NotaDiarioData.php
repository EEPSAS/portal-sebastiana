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
        public ?int $total_aulas_previstas,
        public string $situacao,
        public ?string $data_registro,
        public ?string $observacoes,
        public AlunoNotaResumoData|Optional $aluno,
        public DisciplinaNotaResumoData|Optional $disciplina,
    ) {}

    /**
     * Constrói o DTO tipado a partir do Model Nota já enriquecido com métricas de falta e período.
     * Aplica o limite legal da LDB (Art. 24 — máximo de 25% de faltas) na situação do estudante.
     */
    public static function fromModel(Nota $nota): self
    {
        $valorNota = (float) $nota->valor_nota;
        $valorMax = (float) ($nota->valor_maximo ?? 10.0);
        $valorMaxPeriodo = (float) ($nota->valor_maximo_periodo ?? $valorMax ?: 10.0);
        $percentualFaltas = isset($nota->percentual_faltas) ? (float) $nota->percentual_faltas : null;

        // Classificação automática combinando assiduidade legal (LDB 25%) e aproveitamento (60% / 80%)
        $proporcao = $valorMaxPeriodo > 0 ? ($valorNota / $valorMaxPeriodo) : 0.0;
        if ($percentualFaltas !== null && $percentualFaltas > 25.0) {
            $situacaoPadrao = 'Risco por Falta';
        } else {
            $situacaoPadrao = $proporcao >= 0.8
                ? 'Acima da Média'
                : ($proporcao >= 0.6 ? 'Na Média' : 'Abaixo da Média');
        }

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
            percentual_faltas: $percentualFaltas,
            total_faltas: isset($nota->total_faltas) ? (int) $nota->total_faltas : null,
            total_aulas_previstas: isset($nota->total_aulas_previstas) ? (int) $nota->total_aulas_previstas : null,
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
                    carga_horaria_anual: $nota->disciplina->carga_horaria_anual !== null
                        ? (int) $nota->disciplina->carga_horaria_anual
                        : null,
                    aulas_semanais: $nota->disciplina->aulas_semanais !== null
                        ? (int) $nota->disciplina->aulas_semanais
                        : null,
                )
                : Optional::create(),
        );
    }
}
