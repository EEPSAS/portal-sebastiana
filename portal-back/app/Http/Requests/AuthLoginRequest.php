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

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            // Usa o mesmo formato normalizado aplicado no cadastro.
            $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
        }
    }

    /**
     * Regras de validação para autenticação.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // E-mail válido e obrigatório
            'email' => ['required', 'string', 'email'],
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
            'email.required' => 'O endereço de e-mail é obrigatório.',
            'email.email' => 'Informe um endereço de e-mail válido.',
            'password.required' => 'A senha de acesso é obrigatória.',
        ];
    }
}
