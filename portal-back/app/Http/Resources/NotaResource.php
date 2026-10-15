<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Resource responsável por padronizar o retorno dos lançamentos de notas no padrão de API.
class NotaResource extends JsonResource
{
    /**
     * Transforma os dados da nota em um array estruturado para o frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_nota' => $this->id_nota,
            'turma_id' => $this->turma_id,
            'disciplina_id' => $this->disciplina_id,
            'usuario_id' => $this->usuario_id,
            'periodo_letivo' => $this->periodo_letivo,
            'tipo_avaliacao' => $this->tipo_avaliacao,
            'valor_nota' => (float) $this->valor_nota,
            'valor_maximo' => (float) ($this->valor_maximo ?? 10.0),
            'data_registro' => $this->data_registro ? $this->data_registro->format('Y-m-d') : null,
            'observacoes' => $this->observacoes,
            // Relacionamento com o estudante avaliado
            'aluno' => $this->whenLoaded('aluno', function () {
                return [
                    'id' => $this->aluno->id,
                    'name' => $this->aluno->name,
                    'email' => $this->aluno->email,
                ];
            }),
            // Relacionamento com a disciplina da avaliação
            'disciplina' => $this->whenLoaded('disciplina', function () {
                return [
                    'id_disciplina' => $this->disciplina->id_disciplina,
                    'nome' => $this->disciplina->nome,
                ];
            }),
        ];
    }
}
