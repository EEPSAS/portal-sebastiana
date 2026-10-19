<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * EspecialistaResumoGerencialResource
 *
 * Papel Didático:
 * Padroniza a resposta analítica de KPIs e distribuição de desempenho de uma turma
 * no endpoint GET /api/turmas/{turma_id}/resumo-gerencial.
 */
class EspecialistaResumoGerencialResource extends JsonResource
{
    /**
     * Transforma o resumo gerencial da turma em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'turma' => $this->resource['turma'] ?? null,
            'periodo_selecionado' => $this->resource['periodo_selecionado'] ?? 'Geral',
            'kpis' => $this->resource['kpis'] ?? [],
            'distribuicao_desempenho' => $this->resource['distribuicao_desempenho'] ?? [],
        ];
    }
}
