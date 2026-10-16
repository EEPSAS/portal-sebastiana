<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação segura da requisição de login/cadastro via Google OAuth.
 */
class AuthGoogleRequest extends FormRequest
{
    /**
     * Determina se a requisição é autorizada.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza os campos antes da validação para aceitar tanto 'credential' (GIS) quanto 'id_token'.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('credential') && $this->has('id_token')) {
            $this->merge([
                'credential' => $this->input('id_token'),
            ]);
        }
    }

    /**
     * Regras de validação para autenticação via Google OAuth.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Credencial criptografada emitida pelo Google (JWT ID Token)
            'credential' => ['required', 'string'],
            // Identificador da turma selecionada pelo aluno (opcional para outros perfis)
            'turma_id' => ['nullable', 'integer', 'exists:turmas,id_turma'],
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
            'credential.required' => 'O token de autenticação do Google é obrigatório.',
            'turma_id.exists' => 'A turma informada não foi localizada no sistema.',
        ];
    }
}
