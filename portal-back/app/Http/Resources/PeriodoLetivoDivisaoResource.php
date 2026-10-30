<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para serialização de uma Divisão / Etapa do Período Letivo
 */
class PeriodoLetivoDivisaoResource extends JsonResource
{
    /**
     * Transforma o recurso em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_divisao' => $this->id_divisao,
            'periodo_letivo_id' => $this->periodo_letivo_id,
            'numero' => (int) $this->numero,
            'nome' => $this->nome,
            'pontos' => (float) $this->pontos,
            'data_inicio' => $this->data_inicio ? $this->data_inicio->format('Y-m-d') : null,
            'data_fim' => $this->data_fim ? $this->data_fim->format('Y-m-d') : null,
            'ordem' => (int) $this->ordem,
            'is_atual' => $this->isVigente(),
        ];
    }
}
