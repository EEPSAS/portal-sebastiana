<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação dos alunos vinculados a uma turma escolar.
 * Expõe com segurança os dados do estudante e os detalhes da sua matrícula (pivot).
 */
class AlunoTurmaResource extends JsonResource
{
    /**
     * Transforma o aluno e seu vínculo de matrícula para a resposta JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Garante a formatação adequada da data da matrícula
        $dataMatricula = null;
        if (! empty($this->pivot?->data_matricula)) {
            $dataMatricula = is_string($this->pivot->data_matricula)
                ? substr($this->pivot->data_matricula, 0, 10)
                : $this->pivot->data_matricula->format('Y-m-d');
        }

        return [
            // Identificador e dados cadastrais do estudante
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,

            // Informações da matrícula vindas da tabela pivô 'matriculas'
            'id_matricula' => $this->pivot?->id_matricula,
            'data_matricula' => $dataMatricula,
            'status_matricula' => $this->pivot?->status_matricula ?? 'Ativo',
        ];
    }
}
