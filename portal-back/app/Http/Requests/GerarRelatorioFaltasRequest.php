<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para blindagem dos parâmetros de consulta do relatório consolidado de faltas.
 */
class GerarRelatorioFaltasRequest extends FormRequest
{
    /**
     * Restringe a geração de relatórios gerenciais de faltas à equipe pedagógica/administrativa.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Valida a existência obrigatória da turma e opcional da disciplina filtrada.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['nullable', 'exists:disciplinas,id_disciplina'],
        ];
    }
}
