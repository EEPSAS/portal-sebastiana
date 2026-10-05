<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para cadastro de uma nova disciplina escolar.
class StoreDisciplinaRequest extends FormRequest
{
    // Autoriza apenas usuários com permissão de gestão acadêmica
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    // Regras de validação para os dados da nova disciplina
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'carga_horaria_anual' => ['required', 'integer', 'min:1'],
            'descricao' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
