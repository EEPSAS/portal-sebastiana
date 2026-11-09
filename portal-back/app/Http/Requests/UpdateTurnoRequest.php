<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação da atualização de configurações de um Turno Escolar.
 */
class UpdateTurnoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && $user->canManageAcademic();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'hora_inicio' => ['required', 'string', 'date_format:H:i'],
            'hora_fim' => ['required', 'string', 'date_format:H:i'],
            'duracao_aula_minutos' => ['required', 'integer', 'min:20', 'max:120'],
            'intervalo_inicio' => ['nullable', 'string', 'date_format:H:i'],
            'intervalo_fim' => ['nullable', 'string', 'date_format:H:i'],
            'quantidade_aulas' => ['required', 'integer', 'min:1', 'max:12'],
            'ativo' => ['sometimes', 'boolean'],
            'descricao' => ['nullable', 'string', 'max:255'],
            'grade_horarios' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'hora_inicio.required' => 'O horário de início do turno é obrigatório.',
            'hora_inicio.date_format' => 'O horário de início deve estar no formato HH:MM.',
            'hora_fim.required' => 'O horário de término do turno é obrigatório.',
            'hora_fim.date_format' => 'O horário de término deve estar no formato HH:MM.',
            'duracao_aula_minutos.required' => 'A duração das aulas (módulo em minutos) é obrigatória.',
            'duracao_aula_minutos.min' => 'A duração mínima da aula deve ser de 20 minutos.',
            'duracao_aula_minutos.max' => 'A duração máxima da aula deve ser de 120 minutos.',
            'quantidade_aulas.required' => 'A quantidade de aulas do turno é obrigatória.',
            'quantidade_aulas.min' => 'O turno deve ter pelo menos 1 aula.',
            'quantidade_aulas.max' => 'O turno não pode exceder 12 aulas.',
        ];
    }
}
