<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para criação e atualização de Ciclos Escolares (Item 3.1).
 */
class StoreCicloRequest extends FormRequest
{
    // Autoriza apenas Especialistas Pedagógicos e Administradores
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    // Regras de validação do ciclo escolar
    public function rules(): array
    {
        $cicloRoute = $this->route('ciclo');
        $cicloId = is_object($cicloRoute) ? $cicloRoute->id_ciclo : $cicloRoute;

        return [
            'nome' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ciclos', 'nome')->ignore($cicloId, 'id_ciclo'),
            ],
            // Comentário curto exibido abaixo do rótulo do ciclo (limite de 256 caracteres)
            'descricao' => ['nullable', 'string', 'max:256'],
        ];
    }

    // Mensagens amigáveis em português
    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do ciclo escolar (ex: 1º Ano) é obrigatório.',
            'nome.unique' => 'Já existe um ciclo escolar cadastrado com este nome.',
            'descricao.max' => 'O comentário do ciclo deve ter no máximo 256 caracteres.',
        ];
    }
}
