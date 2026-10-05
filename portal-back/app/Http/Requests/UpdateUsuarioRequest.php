<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Validação para atualização cadastral de usuários pelo administrador.
class UpdateUsuarioRequest extends FormRequest
{
    // Autoriza apenas administradores com permissão de gerenciar usuários
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasPermissionTo('gerenciar_usuarios');
    }

    // Regras de validação para os dados do usuário, ignorando o e-mail atual
    public function rules(): array
    {
        $usuario = $this->route('usuario');
        $usuarioId = is_object($usuario) ? $usuario->id : $usuario;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($usuarioId)],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'exists:roles,slug'],
            'ativo' => ['nullable', 'boolean'],
        ];
    }
}
