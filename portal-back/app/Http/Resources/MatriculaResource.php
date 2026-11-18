<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação do vínculo de Matrícula (Aluno na Turma).
 */
class MatriculaResource extends JsonResource
{
    /**
     * Transforma a matrícula em resposta estruturada.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Aplica blindagem RBAC na auditoria para expor apenas a Especialista/Adm
        $solicitante = $request->user();
        $auditoria = $this->resource->obterAuditoriaParaApi($solicitante instanceof User ? $solicitante : null);

        return [
            // Identificador da matrícula escolar
            'id_matricula' => $this->id_matricula,
            'usuario_id' => $this->usuario_id,
            'turma_id' => $this->turma_id,
            'data_matricula' => $this->data_matricula?->format('Y-m-d') ?? $this->data_matricula,
            'status_matricula' => $this->status_matricula,
            // Dados resumidos das entidades relacionadas
            'aluno' => [
                'id' => $this->aluno?->id,
                'name' => $this->aluno?->name,
                'email' => $this->aluno?->email,
            ],
            'turma' => [
                'id_turma' => $this->turma?->id_turma,
                'nome_identificador' => $this->turma?->nome_identificador,
            ],
            'ultima_acao' => $auditoria['ultima_acao'],
            'ultimas_acoes' => $auditoria['ultimas_acoes'],
        ];
    }
}
