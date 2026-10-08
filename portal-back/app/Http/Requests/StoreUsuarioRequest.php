<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para cadastro de novos usuários pelo administrador.
class StoreUsuarioRequest extends FormRequest
{
    // Autoriza apenas administradores com permissão de gerenciar usuários
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasPermissionTo('gerenciar_usuarios');
    }

    // Regras de validação para os dados cadastrais e perfil do usuário
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'exists:roles,slug'],
            'ativo' => ['nullable', 'boolean'],
        ];
    }
}
