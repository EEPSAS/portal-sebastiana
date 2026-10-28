<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para aprovação e vínculo de Professor na instituição (Item 2.3.2).
 */
class ConfirmarProfessorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->canManageAcademic() || $user->isAdm() || $user->isEspecialista());
    }

    public function rules(): array
    {
        return [
            // Permite enviar uma ou várias disciplinas na aprovação do docente
            'disciplina_id' => ['nullable', 'integer', 'exists:disciplinas,id_disciplina'],
            'disciplina_ids' => ['nullable', 'array'],
            'disciplina_ids.*' => ['integer', 'exists:disciplinas,id_disciplina'],
        ];
    }

    public function messages(): array
    {
        return [
            'disciplina_id.exists' => 'A disciplina selecionada não existe no catálogo.',
            'disciplina_ids.*.exists' => 'Uma das disciplinas selecionadas não existe no catálogo.',
        ];
    }
}

