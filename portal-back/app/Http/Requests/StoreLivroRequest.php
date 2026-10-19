<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreLivroRequest - Validação de Entrada para Cadastro de Livro Físico
 *
 * Papel Didático:
 * Blindagem de entrada da rota POST /api/livros. Garante que apenas gestores
 * da biblioteca cadastrem obras e valida a integridade das quantidades do acervo.
 */
class StoreLivroRequest extends FormRequest
{
    /**
     * Autoriza apenas usuários com permissão de gestão da biblioteca escolar.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Regras de validação para os dados cadastrais do livro físico.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'codigo_livro' => ['nullable', 'string', 'max:100'],
            'titulo' => ['required', 'string', 'max:255'],
            'capa' => ['nullable', 'string', 'max:500'],
            'autor' => ['required', 'string', 'max:255'],
            'editora' => ['nullable', 'string', 'max:255'],
            'data_lancamento' => ['nullable', 'date'],
            'data_publicacao' => ['nullable', 'date'],
            'prateleira_localizacao' => ['nullable', 'string', 'max:255'],
            'genero' => ['nullable', 'string', 'max:100'],
            'quantidade_total' => ['required', 'integer', 'min:1'],
            'quantidade_disponivel' => ['nullable', 'integer', 'min:0', 'lte:quantidade_total'],
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
            'quantidade_disponivel.lte' => 'A quantidade disponível não pode ser maior que a quantidade total.',
        ];
    }
}
