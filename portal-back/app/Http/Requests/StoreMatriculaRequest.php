<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para matrícula de alunos em turmas escolares.
class StoreMatriculaRequest extends FormRequest
{
    // Autoriza apenas usuários com permissão de gestão acadêmica
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    // Regras de validação para os dados da matrícula
    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'usuario_id' => ['required', 'exists:users,id'],
            'data_matricula' => ['nullable', 'date'],
            'status_matricula' => ['nullable', 'string', 'in:Ativo,Transferido,Evadido'],
        ];
    }
}
