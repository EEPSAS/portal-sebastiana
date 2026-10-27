<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação do vínculo entre Professor e Disciplina Curricular.
 *
 * Papel Didático:
 * Garante que o Especialista ou Administrador envie um identificador válido
 * de disciplina existente no catálogo acadêmico da instituição.
 */
class VincularProfessorDisciplinaRequest extends FormRequest
{
    /**
     * Determina se o usuário tem autorização para realizar a solicitação.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        // Apenas Especialistas e Administradores possuem privilégios de gestão pedagógica
        return $user && ($user->canManageAcademic() || $user->isAdm() || $user->isEspecialista());
    }

    /**
     * Regras de validação estritas da requisição.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'disciplina_id' => [
                'required',
                'integer',
                'exists:disciplinas,id_disciplina',
            ],
        ];
    }

    /**
     * Mensagens amigáveis em português (pt-BR).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'disciplina_id.required' => 'A disciplina curricular é obrigatória.',
            'disciplina_id.integer' => 'O identificador da disciplina deve ser um número inteiro.',
            'disciplina_id.exists' => 'A disciplina selecionada não foi encontrada no catálogo escolar.',
        ];
    }
}
