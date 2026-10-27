<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TurmaHorarioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $horario = $this->horarios->firstWhere('ano_letivo', $this->ano_letivo);

        return [
            'turma' => [
                'id_turma' => $this->id_turma,
                'nome_identificador' => $this->nome_identificador,
                'ano_letivo' => (int) $this->ano_letivo,
            ],
            'horario' => $horario ? new HorarioResource($horario) : null,
        ];
    }
}
