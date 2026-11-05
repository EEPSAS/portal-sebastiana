<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFrequenciaManualRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isEspecialista() || $user->isAdm());
    }

    /**
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => [
                'required',
                Rule::exists('turma_disciplinas', 'disciplina_id')
                    ->where('turma_id', $this->input('turma_id')),
            ],
            'usuario_id' => [
                'required',
                Rule::exists('matriculas', 'usuario_id')
                    ->where('turma_id', $this->input('turma_id'))
                    ->where('status_matricula', 'Ativo'),
            ],
            'data_aula' => ['required', 'date'],
            'quantidade_aulas' => ['required', 'integer', 'min:1', 'max:10'],
            'status_presenca' => ['required', Rule::in(['Presente', 'Falta', 'Falta Justificada'])],
            'justificativa' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'disciplina_id.exists' => 'A disciplina selecionada não pertence à turma informada.',
            'usuario_id.exists' => 'O aluno precisa ter matrícula ativa na turma selecionada.',
            'data_aula.required' => 'A data da aula é obrigatória.',
            'quantidade_aulas.required' => 'Informe a quantidade de aulas.',
            'status_presenca.in' => 'Selecione uma situação de presença válida.',
        ];
    }
}
