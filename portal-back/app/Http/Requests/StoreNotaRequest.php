<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotaRequest extends FormRequest
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
            'usuario_id' => ['required', 'exists:users,id'],
            'periodo_letivo' => ['required', 'string', 'max:50'],
            'tipo_avaliacao' => ['required', 'string', 'max:100'],
            'valor_nota' => ['required', 'numeric', 'min:0'],
            'valor_maximo' => ['nullable', 'numeric', 'min:0.1'],
            'data_registro' => ['nullable', 'date'],
            'remessa_origem_id' => ['nullable', 'exists:remessas_docentes,id_remessa'],
            'observacoes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
