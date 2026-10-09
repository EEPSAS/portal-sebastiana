<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação para o upload de relatório/planilha consolidada do diário escolar.
 */
class ImportarRelatorioTurmaRequest extends FormRequest
{
    /**
     * Determina se o usuário está autorizado a fazer essa requisição.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Regras de validação da requisição.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Aceita tanto o campo 'arquivo' quanto 'planilha' para conveniência do frontend
            'arquivo' => ['required_without:planilha', 'file', 'max:10240'],
            'planilha' => ['required_without:arquivo', 'file', 'max:10240'],
            'periodo_letivo' => ['nullable', 'string', 'max:100'],
            'data_aula' => ['nullable', 'date'],
        ];
    }

    /**
     * Mensagens de erro amigáveis para retorno da API.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'arquivo.required_without' => 'Por favor, selecione uma planilha ou arquivo CSV para importar.',
            'planilha.required_without' => 'Por favor, selecione uma planilha ou arquivo CSV para importar.',
            'arquivo.file' => 'O item enviado deve ser um arquivo válido.',
            'planilha.file' => 'O item enviado deve ser um arquivo válido.',
            'arquivo.max' => 'O arquivo não pode exceder 10MB.',
            'planilha.max' => 'O arquivo não pode exceder 10MB.',
            'data_aula.date' => 'A data da aula informada deve ser uma data válida.',
        ];
    }
}
