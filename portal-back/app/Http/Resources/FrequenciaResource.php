<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FrequenciaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_frequencia' => $this->id_frequencia,
            'turma_id' => $this->turma_id,
            'disciplina_id' => $this->disciplina_id,
            'usuario_id' => $this->usuario_id,
            'data_aula' => $this->data_aula?->format('Y-m-d') ?? $this->data_aula,
            'quantidade_aulas' => $this->quantidade_aulas,
            'status_presenca' => $this->status_presenca,
            'justificativa' => $this->justificativa,
            'aluno' => $this->whenLoaded('aluno', fn () => [
                'id' => $this->aluno->id,
                'name' => $this->aluno->name,
            ]),
            'disciplina' => $this->whenLoaded('disciplina', fn () => [
                'id_disciplina' => $this->disciplina->id_disciplina,
                'nome' => $this->disciplina->nome,
            ]),
        ];
    }
}
