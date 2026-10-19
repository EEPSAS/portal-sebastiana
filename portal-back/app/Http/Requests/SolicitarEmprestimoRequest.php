<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * SolicitarEmprestimoRequest - Validação de Entrada para Solicitação de Empréstimo
 *
 * Papel Didático:
 * Garante que o livro solicitado exista na tabela 'livros' (coluna 'id_livro')
 * antes de encaminhar a requisição ao EmprestimoController.
 */
class SolicitarEmprestimoRequest extends FormRequest
{
    /**
     * Autoriza qualquer usuário autenticado (a checagem granular ocorre via Policy no Controller).
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Regras de validação do exemplar solicitado e observações opcionais.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'livro_id' => ['required', 'exists:livros,id_livro'],
            'observacoes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Mensagens amigáveis em português para feedback de validação.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'livro_id.required' => 'O livro a ser solicitado é obrigatório.',
            'livro_id.exists' => 'O livro informado não foi encontrado no acervo.',
        ];
    }
}
