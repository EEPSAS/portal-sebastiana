<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

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
