<?php

namespace App\Http\Requests;

use App\Models\Evento;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEventoRequest extends FormRequest
{
    // Verifica se o usuario logado tem permissao para editar eventos
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageEvents();
    }

    // Regras de validacao para atualizacao parcial ou total do evento
    public function rules(): array
    {
        // Obtem a instancia do evento vinda da rota
        $evento = $this->route('evento');
        // Usa a nova data_inicio enviada ou mantem a data atual salva no banco
        $dataInicio = $this->input('data_inicio') ?? ($evento instanceof Evento ? $evento->data_inicio?->format('Y-m-d') : null);

        return [
            // Titulo validado apenas se estiver presente no payload (sometimes)
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            // Descricao opcional
            'descricao' => ['nullable', 'string'],
            // Data inicial validada apenas se for enviada na requisicao
            'data_inicio' => ['sometimes', 'required', 'date'],
            // Data final deve respeitar a data inicial (nova ou ja existente)
            'data_fim' => ['nullable', 'date', $dataInicio ? "after_or_equal:{$dataInicio}" : 'date'],
            // Horarios opcionais no formato 24h
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'hora_fim' => ['nullable', 'date_format:H:i'],
            // Indicador de dia inteiro
            'dia_inteiro' => ['nullable', 'boolean'],
            // Categoria do evento
            'tipo' => ['nullable', 'string', 'max:50'],
            // Indicador de destaque
            'importante' => ['nullable', 'boolean'],
            // Local do evento
            'local' => ['nullable', 'string', 'max:255'],
            // Cor para exibicao visual
            'cor' => ['nullable', 'string', 'max:30'],
        ];
    }

    // Mensagens de erro customizadas retornadas ao usuario
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