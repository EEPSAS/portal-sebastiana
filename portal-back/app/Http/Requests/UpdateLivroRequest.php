<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateLivroRequest - Validação de Entrada para Edição de Livro Físico
 *
 * Papel Didático:
 * Protege a rota PUT/PATCH /api/livros/{id}, permitindo atualização parcial
 * ('sometimes') dos dados bibliográficos por gestores da biblioteca.
 */
class UpdateLivroRequest extends FormRequest
{
    /**
     * Autoriza apenas usuários com permissão de gestão da biblioteca escolar.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Regras de validação parcial ou total para os dados do livro.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'codigo_livro' => ['nullable', 'string', 'max:100'],
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'capa' => ['nullable', 'string', 'max:500'],
            'autor' => ['sometimes', 'required', 'string', 'max:255'],
            'editora' => ['nullable', 'string', 'max:255'],
            'data_lancamento' => ['nullable', 'date'],
            'data_publicacao' => ['nullable', 'date'],
            'prateleira_localizacao' => ['nullable', 'string', 'max:255'],
            'genero' => ['nullable', 'string', 'max:100'],
            'quantidade_total' => ['sometimes', 'required', 'integer', 'min:1'],
            'quantidade_disponivel' => ['nullable', 'integer', 'min:0'],
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
            'titulo.required' => 'O título do livro é obrigatório.',
            'autor.required' => 'O autor do livro é obrigatório.',
            'quantidade_total.required' => 'A quantidade total de exemplares é obrigatória.',
            'quantidade_total.min' => 'A quantidade total deve ser de pelo menos 1 exemplar.',
        ];
    }
}
