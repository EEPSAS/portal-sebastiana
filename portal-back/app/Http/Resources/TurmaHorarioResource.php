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

        // Lista as disciplinas previstas na grade da turma com quantidade de aulas semanais e anuais (Item 3.4c)
        $disciplinasPrevistas = $this->relationLoaded('turmaDisciplinas')
            ? $this->turmaDisciplinas->filter(fn ($td) => $td->disciplina !== null)->map(fn ($td) => [
                'id_disciplina' => $td->disciplina->id_disciplina,
                'nome' => $td->disciplina->nome,
                'aulas_semanais' => (int) ($td->disciplina->aulas_semanais ?: intdiv(max(40, (int) $td->disciplina->carga_horaria_anual), 40)),
                'carga_horaria_anual' => (int) $td->disciplina->carga_horaria_anual,
                'professor_id' => $td->professor_id,
                'professor_nome' => $td->professor?->name,
            ])->values()
            : [];

        return [
            'turma' => [
                'id_turma' => $this->id_turma,
                'nome_identificador' => $this->nome_identificador,
                'ano_letivo' => (int) $this->ano_letivo,
                'ciclo_id' => $this->ciclo_id,
                'ciclo_nome' => $this->relationLoaded('ciclo') ? $this->ciclo?->nome : null,
                'disciplinas_previstas' => $disciplinasPrevistas,
            ],
            'horario' => $horario ? new HorarioResource($horario) : null,
        ];
    }
}
