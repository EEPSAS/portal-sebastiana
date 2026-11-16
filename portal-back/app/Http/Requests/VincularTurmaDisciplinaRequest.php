<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para blindagem do vínculo de disciplina (e professor opcional) a uma turma escolar.
 */
class VincularTurmaDisciplinaRequest extends FormRequest
{
    /**
     * Autoriza a alteração da grade da turma apenas para Especialista e Administrador.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Valida a existência da disciplina obrigatória e do docente opcional.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'professor_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
