<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            // Evita registrar contas administrativas com endereço incompatível com o papel.
            $role = $this->input('role', UserRole::ALUNO->value);
            if ($this->filled('role_id')) {
                $role = Role::find($this->input('role_id'))?->slug ?? $role;
            }

            $domain = UserRole::tryFrom((string) $role)?->institutionalEmailDomain();
            $email = strtolower(trim((string) $this->input('email')));

            if ($domain !== null && ! str_ends_with($email, $domain)) {
                $validator->errors()->add('email', 'O e-mail deve corresponder ao papel escolar informado.');
            }
        });
    }
}
