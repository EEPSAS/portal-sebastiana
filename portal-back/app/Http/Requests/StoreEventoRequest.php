<?php

namespace App\Http\Requests;

use App\Enums\TipoEvento;
use Illuminate\Contracts\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

// Validação para cadastro de novos eventos no calendário escolar.
class StoreEventoRequest extends FormRequest
{
    // Permite que qualquer usuário autenticado crie eventos no calendário
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    // Normaliza o tipo de evento caso seja fornecido como texto flexível
    protected function prepareForValidation(): void
    {
        if ($this->has('tipo') && is_string($this->input('tipo'))) {
            $parsed = TipoEvento::tryFromLoose($this->input('tipo'));
            if ($parsed) {
                $this->merge(['tipo' => $parsed->value]);
            }
        }
    }

    // Define as regras de validacao para o cadastro do evento
    /** @return array<string, list<string|Rule>> */
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'data_inicio' => ['required', 'date_format:Y-m-d'],
            'data_fim' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:data_inicio'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'tipo' => ['sometimes', 'required', new Enum(TipoEvento::class)],
            'importante' => ['sometimes', 'boolean'],
            'local' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Validações contextuais adicionais de permissão por tipo de evento.
     *
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $tipoInformado = $this->input('tipo');
                if (! $tipoInformado) {
                    return;
                }

                $tipoEnum = TipoEvento::tryFromLoose($tipoInformado);
                if ($tipoEnum && $tipoEnum->isRestrito() && ! $this->user()?->canManageEvents()) {
                    $validator->errors()->add(
                        'tipo',
                        'Apenas Especialistas e Administradores possuem permissão para cadastrar Provas, Sábados Letivos ou Feriados e Recessos.'
                    );
                }
            },
        ];
    }

    // Mensagens de erro personalizadas para exibicao ao usuario
    public function messages(): array
    {
        return [
            'titulo.required' => 'O título do evento é obrigatório.',
            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date_format' => 'A data de início deve estar no formato AAAA-MM-DD.',
            'data_fim.date_format' => 'A data de término deve estar no formato AAAA-MM-DD.',
            'data_fim.after_or_equal' => 'A data de término deve ser igual ou posterior à data de início.',
            'hora_inicio.date_format' => 'O formato da hora de início deve ser HH:MM (ex: 08:00).',
            'importante.boolean' => 'O campo importante deve ser verdadeiro ou falso.',
            'tipo.required' => 'O tipo do evento não pode ser vazio.',
        ];
    }
}
