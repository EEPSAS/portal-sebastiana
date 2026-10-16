<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação do arquivo CSV de importação em massa (Mass Assignment) do acervo de livros.
 *
 * Papel Didático:
 * Blinda o endpoint `POST /api/livros/importar-csv`, garantindo que apenas os perfis
 * Bibliotecária, Especialista e Administrador possam enviar a planilha consolidada.
 */
class ImportarLivrosCsvRequest extends FormRequest
{
    /**
     * Determina se o usuário autenticado tem permissão para importar livros via CSV.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Regras de validação do arquivo CSV enviado.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Aceita o campo 'arquivo' ou 'csv' com extensão .csv ou .txt até 5MB
            'arquivo' => ['required_without:csv', 'file', 'mimes:csv,txt', 'max:5120'],
            'csv' => ['required_without:arquivo', 'file', 'mimes:csv,txt', 'max:5120'],
        ];
    }

    /**
     * Mensagens de erro amigáveis em português para retorno da API.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'arquivo.required_without' => 'Por favor, selecione um arquivo CSV válido para importar os livros.',
            'csv.required_without' => 'Por favor, selecione um arquivo CSV válido para importar os livros.',
            'arquivo.file' => 'O item enviado deve ser um arquivo válido.',
            'arquivo.mimes' => 'O arquivo deve estar no formato CSV (.csv ou .txt).',
            'csv.mimes' => 'O arquivo deve estar no formato CSV (.csv ou .txt).',
            'arquivo.max' => 'O arquivo CSV não pode exceder 5MB.',
        ];
    }
}
