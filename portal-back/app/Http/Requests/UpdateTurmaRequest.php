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
     * Determina se o usuário está autorizado a atualizar os dados da turma.
     * Apenas Especialistas Pedagógicos e Administradores possuem permissão de escrita.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Regras de validação dos campos cadastrais da turma.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Identificador amigável da turma (ex: 3º Ano Técnico)
            'nome_identificador' => ['sometimes', 'required', 'string', 'max:100'],
            'ciclo_id' => ['nullable', 'integer', 'exists:ciclos,id_ciclo'],
            'ano_letivo' => ['sometimes', 'required', 'integer', 'min:2020', 'max:2100'],
            'turno' => ['sometimes', 'required', 'string', 'in:Matutino,Vespertino,Noturno,Integral'],
            // Limite de vagas da sala para controle de matrículas ativas
            'capacidade_maxima' => ['sometimes', 'required', 'integer', 'min:1'],
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
            'ciclo_id.exists' => 'O ciclo escolar selecionado é inválido.',
            'ano_letivo.integer' => 'O ano letivo deve ser um número inteiro válido.',
            'turno.in' => 'O turno selecionado é inválido.',
            'capacidade_maxima.integer' => 'A capacidade máxima deve ser um número inteiro válido.',
            'capacidade_maxima.min' => 'A capacidade máxima deve ser de pelo menos 1 estudante.',
            'status.in' => 'O status informado é inválido.',
        ];
    }
}
