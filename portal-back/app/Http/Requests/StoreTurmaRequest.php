<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para cadastro de uma nova turma escolar.
class StoreTurmaRequest extends FormRequest
{
    // Autoriza apenas usuários com permissão de gestão acadêmica
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    // Regras de validação para os dados da nova turma
    public function rules(): array
    {
        return [
            'nome_identificador' => ['required', 'string', 'max:255'],
            'ciclo_id' => ['nullable', 'integer', 'exists:ciclos,id_ciclo'],
            'turno' => ['required', 'string', 'in:Matutino,Vespertino,Noturno,Integral'],
            'ano_letivo' => ['required', 'integer', 'min:2000', 'max:2100'],
            'capacidade_maxima' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status' => ['nullable', 'string', 'in:Ativa,Inativa,Concluída'],
        ];
    }

    /**
     * Mensagens de validação em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nome_identificador.required' => 'O nome identificador da turma é obrigatório.',
            'ciclo_id.exists' => 'O ciclo escolar selecionado é inválido.',
            'turno.required' => 'O turno da turma é obrigatório.',
            'turno.in' => 'O turno deve ser Matutino, Vespertino, Noturno ou Integral.',
            'ano_letivo.required' => 'O ano letivo é obrigatório.',
            'status.in' => 'O status deve ser Ativa, Inativa ou Concluída.',
        ];
    }
}
