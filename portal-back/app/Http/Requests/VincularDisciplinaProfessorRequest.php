<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para blindagem de entrada no vínculo de professor a uma disciplina em turma específica.
 */
class VincularDisciplinaProfessorRequest extends FormRequest
{
    /**
     * A autorização de escrita na disciplina é verificada pela Policy da entidade.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Regras de validação garantindo que a turma e o docente existam na base de dados.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'professor_id' => ['required', 'exists:users,id'],
        ];
    }
}
