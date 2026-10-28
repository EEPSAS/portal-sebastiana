<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para aprovação de login e vínculo de Aluno a uma Turma Escolar (Item 2.3.1).
 */
class ConfirmarAlunoVinculoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->canManageAcademic() || $user->isAdm() || $user->isEspecialista());
    }

    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'integer', 'exists:turmas,id_turma'],
        ];
    }

    public function messages(): array
    {
        return [
            'turma_id.required' => 'Para aprovar o acesso do aluno, é obrigatório vinculá-lo a uma turma da escola.',
            'turma_id.exists' => 'A turma selecionada não foi encontrada.',
        ];
    }
}

