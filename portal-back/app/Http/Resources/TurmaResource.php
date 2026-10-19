<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação e consulta de Turmas Escolares.
 */
class TurmaResource extends JsonResource
{
    /**
     * Transforma os dados da turma para consumo no frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Identificador da turma
            'id_turma' => $this->id_turma,
            'nome_identificador' => $this->nome_identificador,
            'ano_letivo' => (int) $this->ano_letivo,
            'turno' => $this->turno,
            'capacidade_maxima' => (int) ($this->capacidade_maxima ?? 40),
            'status' => $this->status,
            // Métricas agregadas (quando carregadas com withCount)
            'total_alunos' => $this->whenCounted('alunos'),
            'total_disciplinas' => $this->whenCounted('disciplinas'),
        ];
    }
}
