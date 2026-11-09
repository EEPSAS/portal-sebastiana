<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para serialização de um Turno de Funcionamento e seus módulos escolares.
 */
class TurnoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'hora_inicio' => $this->hora_inicio,
            'hora_fim' => $this->hora_fim,
            'duracao_aula_minutos' => (int) $this->duracao_aula_minutos,
            'intervalo_inicio' => $this->intervalo_inicio,
            'intervalo_fim' => $this->intervalo_fim,
            'quantidade_aulas' => (int) $this->quantidade_aulas,
            'ativo' => (bool) $this->ativo,
            'descricao' => $this->descricao,
            'icone' => $this->icone,
            'cor' => $this->cor,
            'grade_horarios' => $this->obterGradeHorarios(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
