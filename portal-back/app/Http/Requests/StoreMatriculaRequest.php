<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatriculaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

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
