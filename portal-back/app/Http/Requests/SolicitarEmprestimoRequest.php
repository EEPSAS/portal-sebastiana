<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

// Validação para solicitação de empréstimo de livro por usuários.
class SolicitarEmprestimoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    // Autoriza qualquer usuário autenticado
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    // Regras de validação do livro solicitado e observações
    public function rules(): array
    {
        return [
            'livro_id' => ['required', 'exists:livros,id_livro'],
            'observacoes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    // Mensagens customizadas de validação
    public function messages(): array
    {
        return [
            'livro_id.required' => 'O livro a ser solicitado é obrigatório.',
            'livro_id.exists' => 'O livro informado não foi encontrado no acervo.',
        ];
    }
}
