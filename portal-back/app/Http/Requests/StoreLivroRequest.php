<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLivroRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'capa' => ['nullable', 'string', 'max:500'],
            'autor' => ['required', 'string', 'max:255'],
            'editora' => ['nullable', 'string', 'max:255'],
            'data_publicacao' => ['nullable', 'date'],
            'prateleira_localizacao' => ['nullable', 'string', 'max:255'],
            'genero' => ['nullable', 'string', 'max:100'],
            'quantidade_total' => ['required', 'integer', 'min:1'],
            'quantidade_disponivel' => ['nullable', 'integer', 'min:0', 'lte:quantidade_total'],
        ];
    }

    /**
     * Custom messages for validation errors.
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
