<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação segura de credenciais de login.
 */
class AuthLoginRequest extends FormRequest
{
    /**
     * Determina se a requisição pode prosseguir.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regras de validação para autenticação por usuário ou e-mail e senha.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Identificador de usuário (ex.: 'admin') ou endereço de e-mail institucional
            'email' => ['required', 'string', 'max:255'],
            // Senha obrigatória para conferência de hash
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Mensagens amigáveis em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'O usuário de acesso é obrigatório.',
            'password.required' => 'A senha de acesso é obrigatória.',
        ];
    }
}
