<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para blindagem da transferência de matrícula de um aluno entre turmas.
 */
class TransferirMatriculaRequest extends FormRequest
{
    /**
     * Permite a transferência apenas para gestores acadêmicos (Especialista e Adm).
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Garante que a turma de destino exista e seja distinta da turma de origem informada.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'nova_turma_id' => ['required', 'exists:turmas,id_turma', 'different:turma_id'],
        ];
    }
}
