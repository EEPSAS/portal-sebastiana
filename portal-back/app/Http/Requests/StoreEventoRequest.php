<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEventoRequest extends FormRequest
{
    // Verifica se o usuario autenticado tem permissao para criar eventos
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageEvents();
    }

    // Define as regras de validacao para o cadastro do evento
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'data_inicio' => ['required', 'date'],
            'data_fim' => ['nullable', 'date', 'after_or_equal:data_inicio'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'hora_fim' => ['nullable', 'date_format:H:i'],
            'dia_inteiro' => ['nullable', 'boolean'],
            'tipo' => ['nullable', 'string', 'max:50'],
            'importante' => ['nullable', 'boolean'],
            'local' => ['nullable', 'string', 'max:255'],
            'cor' => ['nullable', 'string', 'max:30'],
        ];
    }

    // Mensagens de erro personalizadas para exibicao ao usuario
    public function messages(): array
    {
        return [
            'titulo.required' => 'O título do evento é obrigatório.',
            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date' => 'A data de início deve ser uma data válida.',
            'data_fim.after_or_equal' => 'A data de término deve ser igual ou posterior à data de início.',
            'hora_inicio.date_format' => 'O formato da hora de início deve ser HH:MM (ex: 08:00).',
            'hora_fim.date_format' => 'O formato da hora de término deve ser HH:MM (ex: 12:00).',
        ];
    }
}
