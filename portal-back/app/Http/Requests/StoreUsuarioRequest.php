<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para cadastro de novos usuários pelo administrador.
class StoreUsuarioRequest extends FormRequest
{
    // Autoriza apenas administradores com permissão de gerenciar usuários
    public function authorize(): bool
    {
        return $this->user() !== null && ($this->user()->hasPermissionTo('gerenciar_usuarios') || $this->user()->isAdm());
    }

    // Regras de validação para os dados cadastrais e perfil do usuário
    public function rules(): array
    {
        // Administradores não precisam de e-mail institucional, podendo ser cadastrados apenas com um identificador de usuário
        $isRoleAdm = $this->input('role') === 'adm';
        $emailRules = $isRoleAdm
            ? ['required', 'string', 'max:255', 'unique:users,email']
            : ['required', 'string', 'email', 'max:255', 'unique:users,email'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => $emailRules,
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string'],
            'ativo' => ['nullable', 'boolean'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'data_nascimento' => ['nullable', 'date'],
            'turma_id' => ['nullable', 'integer', 'exists:turmas,id_turma'],
            'status_confirmacao' => ['nullable', 'string', 'in:confirmado,pendente,inativo'],
        ];
    }
}
