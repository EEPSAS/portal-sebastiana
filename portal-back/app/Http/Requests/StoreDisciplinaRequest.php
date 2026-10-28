<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para cadastro de uma nova disciplina escolar (Item 3.3).
class StoreDisciplinaRequest extends FormRequest
{
    // Autoriza apenas usuários com permissão de gestão acadêmica
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    // Prepara os dados calculando a carga horária anual baseada em 40 semanas letivas se omitida
    protected function prepareForValidation(): void
    {
        if ($this->filled('aulas_semanais') && ! $this->filled('carga_horaria_anual')) {
            $this->merge([
                'carga_horaria_anual' => (int) $this->input('aulas_semanais') * 40,
            ]);
        } elseif ($this->filled('carga_horaria_anual') && ! $this->filled('aulas_semanais')) {
            $this->merge([
                'aulas_semanais' => max(1, (int) round(((int) $this->input('carga_horaria_anual')) / 40)),
            ]);
        }
    }

    // Regras de validação para os dados da nova disciplina
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'aulas_semanais' => ['required_without:carga_horaria_anual', 'integer', 'min:1', 'max:30'],
            'carga_horaria_anual' => ['required_without:aulas_semanais', 'integer', 'min:1'],
            'descricao' => ['nullable', 'string', 'max:2000'],
            'ementa' => ['nullable', 'string', 'max:5000'],
            'habilidades_bncc' => ['nullable', 'string', 'max:5000'],
            'objetivo_geral' => ['nullable', 'string', 'max:3000'],
            'objetivo_especifico' => ['nullable', 'string', 'max:3000'],
            // Permite associar a ciclos existentes e/ou criar um novo ciclo na hora (Item 3.1)
            'ciclo_ids' => ['nullable', 'array'],
            'ciclo_ids.*' => ['integer', 'exists:ciclos,id_ciclo'],
            'novo_ciclo_nome' => ['nullable', 'string', 'max:100'],
            // Permite vincular professores diretamente ao criar a disciplina
            'professor_ids' => ['nullable', 'array'],
            'professor_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    // Mensagens em português
    public function messages(): array
    {
        return [
            'nome.required' => 'O nome da disciplina é obrigatório.',
            'aulas_semanais.required_without' => 'Informe a quantidade de aulas semanais da disciplina.',
            'aulas_semanais.min' => 'A disciplina deve ter pelo menos 1 aula semanal.',
        ];
    }
}
