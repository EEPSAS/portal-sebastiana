<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HorarioAulaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dia_semana' => (int) $this->dia_semana,
            'aula_numero' => (int) $this->aula_numero,
            'disciplina' => [
                'id_disciplina' => $this->disciplina->id_disciplina,
                'nome' => $this->disciplina->nome,
                'aulas_semanais' => (int) ($this->disciplina->aulas_semanais ?: intdiv(max(40, (int) $this->disciplina->carga_horaria_anual), 40)),
                'carga_horaria_anual' => (int) $this->disciplina->carga_horaria_anual,
            ],
            'professor' => [
                'id' => $this->professor->id,
                'name' => $this->professor->name,
            ],
        ];
    }
}
