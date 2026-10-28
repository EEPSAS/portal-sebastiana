<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação da exclusão lógica / encerramento de vínculo de usuário
 * com confirmação do nome completo em duas etapas (estilo GitHub - Item 1.3.6).
 */
class DesvincularUsuarioRequest extends FormRequest
{
    // Apenas Administradores podem executar a exclusão/desvínculo de usuários
    public function authorize(): bool
    {
        return $this->user() !== null && ($this->user()->isAdm() || $this->user()->hasPermissionTo('gerenciar_usuarios'));
    }

    // Valida a confirmação do nome completo do usuário quando enviada no corpo da requisição
    public function rules(): array
    {
        return [
            'confirmacao_nome' => ['nullable', 'string', 'max:255'],
        ];
    }
}

