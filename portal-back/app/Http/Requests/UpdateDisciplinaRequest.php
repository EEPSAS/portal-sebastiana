<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para atualização de uma disciplina escolar e seus vínculos com Ciclos (Item 3.3).
 */
class UpdateDisciplinaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('aulas_semanais')) {
            $this->merge([
                'carga_horaria_anual' => (int) $this->input('aulas_semanais') * 40,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'aulas_semanais' => ['sometimes', 'required', 'integer', 'min:1', 'max:30'],
            'carga_horaria_anual' => ['sometimes', 'required', 'integer', 'min:1'],
            'descricao' => ['nullable', 'string', 'max:2000'],
            'ementa' => ['nullable', 'string', 'max:5000'],
            'habilidades_bncc' => ['nullable', 'string', 'max:5000'],
            'objetivo_geral' => ['nullable', 'string', 'max:3000'],
            'objetivo_especifico' => ['nullable', 'string', 'max:3000'],
            'ciclo_ids' => ['nullable', 'array'],
            'ciclo_ids.*' => ['integer', 'exists:ciclos,id_ciclo'],
            'novo_ciclo_nome' => ['nullable', 'string', 'max:100'],
            'professor_ids' => ['nullable', 'array'],
            'professor_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}

