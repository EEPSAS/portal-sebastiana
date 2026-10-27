<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

/**
 * Form Request para alteração de papel/role de usuários pelo Administrador.
 */
class AlterarPapelRequest extends FormRequest
{
    /**
     * Determina se o usuário autenticado tem permissão administrativa para alterar papéis.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasPermissionTo('gerenciar_papeis_permissoes');
    }

    /**
     * Regras de validação para o novo papel.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Valida estritamente contra as constantes do enum UserRole
            'role' => ['required', 'string', new Enum(UserRole::class)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            // Impede atribuir papel escolar a uma conta com domínio de e-mail incompatível.
            $usuario = $this->route('usuario');
            if (! $usuario instanceof User) {
                $usuario = User::find($usuario);
            }

            $role = UserRole::tryFrom((string) $this->input('role'));
            $domain = $role?->institutionalEmailDomain();
            $email = strtolower(trim((string) $usuario?->email));

            if ($domain !== null && ! str_ends_with($email, $domain)) {
                $validator->errors()->add('role', 'O e-mail do usuário não corresponde ao papel escolar informado.');
            }
        });
    }

    /**
     * Mensagens de erro em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required' => 'O papel do usuário é obrigatório.',
            'role.Illuminate\Validation\Rules\Enum' => 'O papel selecionado é inválido.',
        ];
    }
}
