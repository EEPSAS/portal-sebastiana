<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * AlunoCriticoResource
 *
 * Papel Didático:
 * Padroniza a relação de estudantes em situação de risco crítico (por nota ou frequência)
 * retornada pelo endpoint GET /api/turmas/{turma_id}/alunos-criticos.
 */
class AlunoCriticoResource extends JsonResource
{
    /**
     * Transforma a listagem de alunos críticos da turma em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'turma' => $this->resource['turma'] ?? null,
            'periodo_selecionado' => $this->resource['periodo_selecionado'] ?? 'Geral',
            'total_criticos' => (int) ($this->resource['total_criticos'] ?? 0),
            'alunos_criticos' => $this->resource['alunos_criticos'] ?? [],
        ];
    }
}
