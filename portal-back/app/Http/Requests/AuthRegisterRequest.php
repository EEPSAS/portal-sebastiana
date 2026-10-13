<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para auto-cadastro de novos usuários (alunos).
 */
class AuthRegisterRequest extends FormRequest
{
    /**
     * Determina se a requisição pode prosseguir.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regras de validação do auto-cadastro.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Nome completo do aluno
            'name' => ['required', 'string', 'max:255'],
            // E-mail único no banco
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            // Senha segura com no mínimo 6 caracteres
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    /**
     * Mensagens de erro em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'O nome completo é obrigatório.',
            'email.required' => 'O endereço de e-mail é obrigatório.',
            'email.email' => 'Informe um e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado no sistema.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve conter no mínimo 6 caracteres.',
        ];
    }
}
