<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * Form Request para blindagem da atribuição ou revogação direta de permissões a um usuário.
 */
class AtribuirPermissoesUsuarioRequest extends FormRequest
{
    /**
     * Garante que apenas usuários com habilidade de gestão de papéis e permissões executem a ação.
     */
    public function authorize(): bool
    {
        return Gate::allows('gerenciar_papeis_permissoes');
    }

    /**
     * Exige lista estruturada de permissões válidas acompanhadas do booleano de concessão.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'permissoes' => ['required', 'array'],
            'permissoes.*.permission' => ['required', 'string', 'exists:permissions,slug'],
            'permissoes.*.concedida' => ['required', 'boolean'],
        ];
    }
}
