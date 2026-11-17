<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request de validação dos filtros de listagem de tokens Sanctum.
 */
class IndexTokenSessaoRequest extends FormRequest
{
    /**
     * Autoriza apenas administradores (quem possui permissão de gerenciar usuários).
     */
    public function authorize(): bool
    {
        return $this->user()?->can('gerenciar_usuarios') ?? false;
    }

    /**
     * Regras de validação para filtros de consulta e paginação de sessões.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Texto livre para filtrar por nome/e-mail do usuário, IP ou navegador
            'busca' => ['nullable', 'string', 'max:150'],
            // Filtra pela origem em que o token surgiu
            'origem' => ['nullable', 'string', Rule::in(['login_senha', 'login_google', 'auto_cadastro'])],
            // Filtra entre tokens ativos (dentro das 6h) ou expirados (aguardando limpeza de 8h)
            'status' => ['nullable', 'string', Rule::in(['ativo', 'expirado'])],
            // Permite filtrar todas as sessões de um usuário específico
            'usuario_id' => ['nullable', 'integer', 'exists:users,id'],
            // Controles de paginação
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ];
    }
}
