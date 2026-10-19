<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * DesempenhoComponenteResource
 *
 * Papel Didático:
 * Padroniza o retorno do ranking consolidado de desempenho por disciplina da turma
 * no endpoint GET /api/turmas/{turma_id}/desempenho-componentes.
 */
class DesempenhoComponenteResource extends JsonResource
{
    /**
     * Transforma o ranking de componentes curriculares da turma em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'turma' => $this->resource['turma'] ?? null,
            'periodo_selecionado' => $this->resource['periodo_selecionado'] ?? 'Geral',
            'ranking_componentes' => $this->resource['ranking_componentes'] ?? [],
        ];
    }
}
