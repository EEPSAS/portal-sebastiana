<?php

namespace App\Http\Requests;

use App\Enums\TipoEvento;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação para cadastro em lote de Sábados Letivos e Feriados/Recessos.
 */
class StoreEventoEmMassaRequest extends FormRequest
{
    /**
     * Apenas gestores (Especialista e Adm) podem cadastrar eventos em massa.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageEvents();
    }

    /**
     * Prepara e normaliza os dados da matriz de eventos antes da validação.
     */
    protected function prepareForValidation(): void
    {
        $eventos = $this->input('eventos');

        if (is_array($eventos)) {
            $normalizados = array_map(function ($item) {
                if (! is_array($item)) {
                    return $item;
                }

                // Normaliza o tipo/categoria enviado
                $tipoRaw = $item['tipo'] ?? $item['categoria'] ?? null;
                $parsed = TipoEvento::tryFromLoose($tipoRaw);

                if ($parsed) {
                    $item['tipo'] = $parsed->value;
                }

                // Normaliza campo data para data_inicio
                if (isset($item['data']) && ! isset($item['data_inicio'])) {
                    $item['data_inicio'] = $item['data'];
                }

                return $item;
            }, $eventos);

            $this->merge(['eventos' => $normalizados]);
        }
    }

    /**
     * Regras de validação para o lote de eventos.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'eventos' => ['required', 'array', 'min:1'],
            'eventos.*.data_inicio' => ['required', 'date_format:Y-m-d'],
            'eventos.*.titulo' => ['required', 'string', 'max:255'],
            'eventos.*.descricao' => ['required', 'string'],
            'eventos.*.tipo' => [
                'required',
                Rule::in([
                    TipoEvento::SABADO_LETIVO->value,
                    TipoEvento::FERIADOS_E_RECESSOS->value,
                ]),
            ],
        ];
    }

    /**
     * Mensagens amigáveis em português para erros de validação da tabela.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'eventos.required' => 'É necessário fornecer ao menos um evento para o cadastro em massa.',
            'eventos.min' => 'É necessário preencher ao menos uma linha válida na tabela.',
            'eventos.*.data_inicio.required' => 'A data é obrigatória em todas as linhas preenchidas.',
            'eventos.*.data_inicio.date_format' => 'A data deve estar no formato AAAA-MM-DD.',
            'eventos.*.titulo.required' => 'O título é obrigatório em todas as linhas preenchidas.',
            'eventos.*.descricao.required' => 'A descrição é obrigatória em todas as linhas preenchidas.',
            'eventos.*.tipo.required' => 'A categoria é obrigatória.',
            'eventos.*.tipo.in' => 'O cadastro em massa permite apenas Sábados Letivos ou Feriados e Recessos.',
        ];
    }
}
