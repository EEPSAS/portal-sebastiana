<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validação para lançamento manual de notas por Especialista ou Administrador.
class StoreNotaRequest extends FormRequest
{
    // Mantém o lançamento manual fora do perfil consultivo do Professor.
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isEspecialista() || $user->isAdm());
    }

    // Confere também se o aluno e a disciplina pertencem à turma informada.
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
            'periodo_letivo' => ['required', 'string', 'max:50'],
            'tipo_avaliacao' => ['required', 'string', 'max:100'],
            'valor_nota' => ['required', 'numeric', 'min:0', 'max:999.99', 'lte:valor_maximo'],
            'valor_maximo' => ['required', 'numeric', 'min:0.1', 'max:999.99'],
            'data_registro' => ['nullable', 'date'],
            'observacoes' => ['nullable', 'string', 'max:255'],
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
            'valor_nota.lte' => 'A nota não pode ultrapassar o valor máximo informado.',
        ];
    }
}
