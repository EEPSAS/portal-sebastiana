<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource que encapsula os indicadores analíticos agregados de uma turma escolar.
 * Utilizado pelos gráficos e cards dos painéis analíticos do frontend.
 */
class TurmaResumoResource extends JsonResource
{
    /**
     * Transforma os indicadores da turma para consumo no frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_turma' => $this->resource['id_turma'] ?? $this->id_turma,
            'nome_identificador' => $this->resource['nome_identificador'] ?? $this->nome_identificador,
            'turno' => $this->resource['turno'] ?? $this->turno,
            'ano_letivo' => (int) ($this->resource['ano_letivo'] ?? $this->ano_letivo),
            'status' => $this->resource['status'] ?? $this->status,
            'total_alunos' => (int) ($this->resource['total_alunos'] ?? 0),
            'media_geral' => isset($this->resource['media_geral']) ? round((float) $this->resource['media_geral'], 2) : 0.0,
            'taxa_presenca' => isset($this->resource['taxa_presenca']) ? round((float) $this->resource['taxa_presenca'], 1) : 0.0,
            'taxa_absenteismo' => isset($this->resource['taxa_absenteismo']) ? round((float) $this->resource['taxa_absenteismo'], 1) : 0.0,
            'total_avaliados' => (int) ($this->resource['total_avaliados'] ?? 0),
        ];
    }
}
