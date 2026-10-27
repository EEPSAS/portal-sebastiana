<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para atualização da persona e diretrizes da Dona Nana.
 *
 * Papel Didático:
 * Valida a autorização restrita (somente Administradores e Especialistas)
 * e exige os 4 pilares instrucionais estruturados para compor o System Prompt.
 */
class UpdateDonaNanaConfigRequest extends FormRequest
{
    /**
     * Autoriza apenas Administradores ou Especialistas.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->isAdm() || $user->isEspecialista();
    }

    /**
     * Regras de validação para os 4 campos do System Prompt e configurações adicionais.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 1. Sua Personalidade
            'personalidade' => ['required', 'string', 'min:10', 'max:5000'],

            // 2. Seu Conhecimento sobre o Portal
            'conhecimento_portal' => ['required', 'string', 'min:10', 'max:5000'],

            // 3. Suas Histórias e Causos
            'historias_causos' => ['required', 'string', 'min:10', 'max:5000'],

            // 4. Diretrizes de Resposta
            'diretrizes_resposta' => ['required', 'string', 'min:10', 'max:5000'],

            // Avatar personalizado (URL ou caminho relativo)
            'avatar_url' => ['nullable', 'string', 'max:500'],

            // Modelo e temperatura opcionais
            'modelo' => ['nullable', 'string', 'max:50'],
            'temperatura' => ['nullable', 'numeric', 'min:0.0', 'max:1.0'],
        ];
    }

    /**
     * Mensagens amigáveis em português brasileiro.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'personalidade.required' => 'O campo Personalidade é obrigatório para definir o tom de voz da Dona Nana.',
            'conhecimento_portal.required' => 'O campo Conhecimento sobre o Portal é obrigatório para orientar os alunos.',
            'historias_causos.required' => 'O campo Histórias e Causos é obrigatório para manter viva a memória da patrona.',
            'diretrizes_resposta.required' => 'O campo Diretrizes de Resposta é obrigatório para estabelecer a postura pedagógica.',
        ];
    }
}
