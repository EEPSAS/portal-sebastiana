<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConsolidarChamadaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'data_aula' => ['required', 'date'],
            'quantidade_aulas' => ['nullable', 'integer', 'min:1', 'max:10'],
            'remessa_origem_id' => ['nullable', 'exists:remessas_docentes,id_remessa'],
            'chamada' => ['required', 'array', 'min:1'],
            'chamada.*.usuario_id' => ['required', 'exists:users,id'],
            'chamada.*.status_presenca' => ['required', 'string', 'in:Presente,Falta,Falta Justificada'],
            'chamada.*.justificativa' => ['nullable', 'string', 'max:500'],
        ];
    }
}
