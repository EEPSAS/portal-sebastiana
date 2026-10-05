<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

// Validação para atualização dos dados de um livro do acervo.
class UpdateLivroRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    // Autoriza apenas usuários com permissão de gestão de biblioteca
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    // Regras de validação parcial ou total para os dados do livro
    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'capa' => ['nullable', 'string', 'max:500'],
            'autor' => ['sometimes', 'required', 'string', 'max:255'],
            'editora' => ['nullable', 'string', 'max:255'],
            'data_publicacao' => ['nullable', 'date'],
            'prateleira_localizacao' => ['nullable', 'string', 'max:255'],
            'genero' => ['nullable', 'string', 'max:100'],
            'quantidade_total' => ['sometimes', 'required', 'integer', 'min:1'],
            'quantidade_disponivel' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    // Mensagens de erro customizadas de validação
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
