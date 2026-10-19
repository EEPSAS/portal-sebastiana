<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * AlunoResumoGlobalResource
 *
 * Papel Didático:
 * Padroniza e blinda a entrega do resumo global do estudante na turma
 * (média geral, frequência global, alertas de risco e cards superiores).
 */
class AlunoResumoGlobalResource extends JsonResource
{
    /**
     * Transforma os dados do resumo global do aluno em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'aluno' => $this->resource['aluno'] ?? null,
            'turma' => $this->resource['turma'] ?? null,
            'periodo_selecionado' => $this->resource['periodo_selecionado'] ?? 'Consolidado Anual',
            'media_geral' => (float) ($this->resource['media_geral'] ?? 0.0),
            'frequencia_global' => (float) ($this->resource['frequencia_global'] ?? 100.0),
            'total_alertas_risco' => (int) ($this->resource['total_alertas_risco'] ?? 0),
            'alertas_risco' => $this->resource['alertas_risco'] ?? [],
            'student_stats' => $this->resource['student_stats'] ?? [],
        ];
    }
}
