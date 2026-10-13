<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação do Boletim Escolar consolidado do Aluno.
 */
class BoletimResource extends JsonResource
{
    /**
     * Transforma os dados consolidados do boletim para o frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'turma_id' => $this->resource['turma_id'] ?? null,
            'aluno_id' => $this->resource['aluno_id'] ?? null,
            'periodo_selecionado' => $this->resource['periodo_selecionado'] ?? null,
            'boletim' => $this->resource['boletim'] ?? [],
            'grafico_boletim' => $this->resource['grafico_boletim'] ?? [],
        ];
    }
}
