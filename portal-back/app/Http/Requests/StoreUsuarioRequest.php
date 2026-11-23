<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

// Validação para cadastro de novos usuários pelo administrador.
class StoreUsuarioRequest extends FormRequest
{
    // Autoriza apenas administradores com permissão de gerenciar usuários
    public function authorize(): bool
    {
        return $this->user() !== null && ($this->user()->hasPermissionTo('gerenciar_usuarios') || $this->user()->isAdm());
    }

    /**
     * Normaliza o campo 'role' antes da validação para aceitar aliases legados ('admin', 'bibliotecario', 'padrao').
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('role') || $this->input('role') === null) {
            return;
        }

        $roleBruto = mb_strtolower(trim((string) $this->input('role')));
        if ($roleBruto === '') {
            $this->merge(['role' => null]);

            return;
        }

        $roleNormalizado = match ($roleBruto) {
            'admin', 'administrador' => UserRole::ADM->value,
            'bibliotecario' => UserRole::BIBLIOTECARIA->value,
            'padrao' => UserRole::ALUNO->value,
            default => $roleBruto,
        };

        $this->merge(['role' => $roleNormalizado]);
    }

    /**
     * Regras de validação para os dados cadastrais e perfil do usuário.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string', new Enum(UserRole::class)],
            'ativo' => ['nullable', 'boolean'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'data_nascimento' => ['nullable', 'date'],
            'turma_id' => ['nullable', 'integer', 'exists:turmas,id_turma'],
            'status_confirmacao' => ['nullable', 'string', 'in:confirmado,pendente,inativo'],
        ];
    }

    /**
     * Mensagens didáticas de validação em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.Illuminate\Validation\Rules\Enum' => 'O papel selecionado é inválido.',
        ];
    }
}
