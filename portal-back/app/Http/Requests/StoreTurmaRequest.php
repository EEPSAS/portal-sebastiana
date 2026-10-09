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
            'turno' => ['required', 'string', 'max:50'],
            'ano_letivo' => ['required', 'integer', 'min:2000', 'max:2100'],
            'capacidade_maxima' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status' => ['nullable', 'string', 'in:Ativa,Concluída'],
        ];
    }
}
