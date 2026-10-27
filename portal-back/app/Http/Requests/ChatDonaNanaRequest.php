<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação de mensagens enviadas à assistente virtual Dona Nana.
 *
 * Papel Didático:
 * Garante que a mensagem não seja vazia nem ultrapasse o limite de caracteres,
 * e valida a integridade do array de histórico caso seja fornecido para diálogos contínuos.
 */
class ChatDonaNanaRequest extends FormRequest
{
    /**
     * Determina se o usuário pode fazer esta requisição.
     * Como a rota é protegida por auth:sanctum, qualquer usuário logado tem permissão.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regras de validação da mensagem de entrada.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // A mensagem do usuário é obrigatória e limitada a 2000 caracteres
            'mensagem' => ['required', 'string', 'min:1', 'max:2000'],

            // Histórico multi-turn opcional (máximo de 20 interações recentes para economia de tokens)
            'historico' => ['nullable', 'array', 'max:20'],
            'historico.*.role' => ['required_with:historico', 'string', 'in:user,model,assistant'],
            'historico.*.text' => ['required_with:historico', 'string', 'max:4000'],

            // Contexto visual de onde partiu a dúvida (aba completa ou balão flutuante)
            'contexto_origem' => ['nullable', 'string', 'in:aba,balao'],
        ];
    }

    /**
     * Mensagens de validação em português brasileiro.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mensagem.required' => 'Por favor, escreva sua dúvida ou pergunta para a Dona Nana.',
            'mensagem.string' => 'A mensagem deve ser um texto válido.',
            'mensagem.max' => 'A mensagem não pode ter mais de 2000 caracteres.',
            'historico.array' => 'O histórico da conversa deve ser uma lista válida de mensagens.',
            'historico.max' => 'O histórico não pode ultrapassar 20 mensagens.',
        ];
    }
}
