<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação e blindagem na atualização cadastral de turmas.
 */
class UpdateTurmaRequest extends FormRequest
{
    /**
     * Determina se o usuário está autorizado a realizar esta requisição.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regras de validação dos campos da turma.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Identificador amigável da turma (ex: 3º Ano Técnico)
            'nome_identificador' => ['sometimes', 'required', 'string', 'max:100'],
            'ano_letivo' => ['sometimes', 'required', 'integer', 'min:2020', 'max:2100'],
            'turno' => ['sometimes', 'required', 'string', 'in:Matutino,Vespertino,Noturno,Integral'],
            'status' => ['sometimes', 'required', 'string', 'in:Ativa,Inativa,Concluída'],
        ];
    }

    /**
     * Mensagens de erro amigáveis em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nome_identificador.required' => 'O nome identificador da turma é obrigatório.',
            'ano_letivo.integer' => 'O ano letivo deve ser um número inteiro válido.',
            'turno.in' => 'O turno selecionado é inválido.',
            'status.in' => 'O status informado é inválido.',
        ];
    }
}
