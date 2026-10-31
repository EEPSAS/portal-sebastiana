<?php

namespace App\Http\Requests;

use App\Models\PeriodoLetivo;
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
            'ano_letivo' => [
                'sometimes',
                'required',
                'integer',
                'min:2000',
                'max:2100',
                function ($attribute, $value, $fail) {
                    if (PeriodoLetivo::count() > 0 && ! PeriodoLetivo::where('ano', $value)->exists()) {
                        $fail('O ano letivo selecionado não corresponde a nenhum Período Letivo cadastrado.');
                    }
                },
            ],
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
            'ano_letivo.required' => 'O ano letivo é obrigatório.',
            'turno.required' => 'O turno é obrigatório.',
            'turno.in' => 'O turno deve ser Matutino, Vespertino, Noturno ou Integral.',
            'capacidade_maxima.required' => 'A capacidade máxima é obrigatória.',
            'capacidade_maxima.min' => 'A capacidade máxima deve ser de pelo menos 1 aluno.',
            'status.required' => 'O status da turma é obrigatório.',
            'status.in' => 'O status deve ser Ativa, Inativa ou Concluída.',
        ];
    }
}
