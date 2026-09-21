<?php

namespace App\Http\Requests;

use App\Models\Evento;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEventoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageEvents();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $evento = $this->route('evento');
        $dataInicio = $this->input('data_inicio') ?? ($evento instanceof Evento ? $evento->data_inicio?->format('Y-m-d') : null);

        return [
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'data_inicio' => ['sometimes', 'required', 'date'],
            'data_fim' => ['nullable', 'date', $dataInicio ? "after_or_equal:{$dataInicio}" : 'date'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'hora_fim' => ['nullable', 'date_format:H:i'],
            'dia_inteiro' => ['nullable', 'boolean'],
            'tipo' => ['nullable', 'string', 'max:50'],
            'importante' => ['nullable', 'boolean'],
            'local' => ['nullable', 'string', 'max:255'],
            'cor' => ['nullable', 'string', 'max:30'],
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
            'titulo.required' => 'O título do evento é obrigatório.',
            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date' => 'A data de início deve ser uma data válida.',
            'data_fim.after_or_equal' => 'A data de término deve ser igual ou posterior à data de início.',
            'hora_inicio.date_format' => 'O formato da hora de início deve ser HH:MM (ex: 08:00).',
            'hora_fim.date_format' => 'O formato da hora de término deve ser HH:MM (ex: 12:00).',
        ];
    }
}
