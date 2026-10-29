<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação e criação de Planos de Estudos.
 *
 * Papel Didático:
 * Garante que apenas dados válidos (nome e disciplina obrigatórios)
 * cheguem ao controller para persistência no banco de dados.
 */
class StorePlanoEstudoRequest extends FormRequest
{
    /**
     * Determina se o usuário está autorizado a fazer essa requisição.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Regras de validação dos campos de entrada.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'min:2', 'max:255'],
            'disciplina_id' => ['nullable', 'integer', 'exists:disciplinas,id_disciplina'],
            'disciplina' => ['required_without:disciplina_id', 'nullable', 'string', 'max:100'],
            'conteudo' => ['nullable', 'string', 'max:150'],
            'descricao' => ['nullable', 'string', 'max:1000'],
            'ativo' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Mensagens de validação amigáveis em pt-BR.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do plano de estudos é obrigatório.',
            'nome.min' => 'O nome do plano deve ter no mínimo 2 caracteres.',
            'disciplina_id.exists' => 'A disciplina selecionada não foi encontrada no catálogo da escola.',
            'disciplina.required_without' => 'Informe a disciplina do plano de estudos.',
            'conteudo.max' => 'O conteúdo ou ementa temática deve ter no máximo 150 caracteres.',
        ];
    }
}
