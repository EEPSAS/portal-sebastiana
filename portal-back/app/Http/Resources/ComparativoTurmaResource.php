<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ComparativoTurmaResource
 *
 * Papel Didático:
 * Padroniza e blinda o retorno comparativo entre o desempenho individual do aluno e a média da turma
 * no endpoint GET /api/alunos/{aluno_id}/turmas/{turma_id}/comparativo-turma.
 */
class ComparativoTurmaResource extends JsonResource
{
    /**
     * Transforma os dados comparativos do aluno vs turma em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'turma_id' => $this->resource['turma_id'] ?? null,
            'aluno_id' => $this->resource['aluno_id'] ?? null,
            'periodo_selecionado' => $this->resource['periodo_selecionado'] ?? null,
            'comparativo' => $this->resource['comparativo'] ?? [],
            'radar' => $this->resource['radar'] ?? [],
        ];
    }
}
