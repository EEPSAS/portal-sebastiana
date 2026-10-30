<?php

namespace App\Http\Requests;

use App\Enums\TipoEvento;
use App\Models\Evento;
use Illuminate\Contracts\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

// Validação para atualização de eventos no calendário escolar.
class UpdateEventoRequest extends FormRequest
{
    // Autoriza se o usuário gerencia eventos escolares ou é o autor do evento
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if ($user->canManageEvents()) {
            return true;
        }

        $evento = $this->route('evento');

        return $evento instanceof Evento && $evento->criador_id === $user->id;
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

    // Regras de validação para atualização parcial ou total do evento
    /** @return array<string, list<string|Rule>> */
    public function rules(): array
    {
        $evento = $this->route('evento');
        $dataInicio = $this->input('data_inicio') ?? ($evento instanceof Evento ? $evento->data_inicio : null);

        return [
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'data_inicio' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'data_fim' => ['sometimes', 'nullable', 'date_format:Y-m-d', $dataInicio ? "after_or_equal:{$dataInicio}" : 'date_format:Y-m-d'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'tipo' => ['sometimes', 'required', new Enum(TipoEvento::class)],
            'importante' => ['sometimes', 'boolean'],
            'local' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $evento = $this->route('evento');

                if (
                    $evento instanceof Evento
                    && $this->has('data_inicio')
                    && ! $this->has('data_fim')
                    && ! $validator->errors()->has('data_inicio')
                ) {
                    $dataFimAtual = $evento->data_fim;
                    if ($dataFimAtual && $this->input('data_inicio') > $dataFimAtual) {
                        $validator->errors()->add(
                            'data_inicio',
                            'A data de início não pode ser posterior à data de término já cadastrada.'
                        );
                    }
                }

                $tipoInformado = $this->input('tipo');
                if ($tipoInformado) {
                    $tipoEnum = TipoEvento::tryFromLoose($tipoInformado);
                    if ($tipoEnum && $tipoEnum->isRestrito() && ! $this->user()?->canManageEvents()) {
                        $validator->errors()->add(
                            'tipo',
                            'Apenas Especialistas e Administradores possuem permissão para atribuir Provas, Sábados Letivos ou Feriados e Recessos.'
                        );
                    }
                }
            },
        ];
    }

    // Mensagens de erro customizadas retornadas ao usuário
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
