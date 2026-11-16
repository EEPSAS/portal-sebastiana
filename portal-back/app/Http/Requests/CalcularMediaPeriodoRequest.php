<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para blindagem dos filtros de cálculo de média da turma por período letivo.
 */
class CalcularMediaPeriodoRequest extends FormRequest
{
    /**
     * Autoriza o cálculo gerencial de médias apenas para gestores acadêmicos.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Valida turma, disciplina e nome do período letivo consultado.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'periodo_letivo' => ['required', 'string'],
        ];
    }
}
