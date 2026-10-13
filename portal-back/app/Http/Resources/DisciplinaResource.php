<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação de Disciplinas da grade curricular.
 */
class DisciplinaResource extends JsonResource
{
    /**
     * Transforma a disciplina em array para resposta da API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Identificador da disciplina
            'id_disciplina' => $this->id_disciplina,
            'nome' => $this->nome,
            'nome_disciplina' => $this->nome,
            'codigo' => $this->codigo ?? null,
            'carga_horaria_anual' => (int) $this->carga_horaria_anual,
            'descricao' => $this->descricao,
        ];
    }
}
