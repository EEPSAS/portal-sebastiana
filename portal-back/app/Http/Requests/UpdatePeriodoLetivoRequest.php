<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Form Request para atualização de Período Letivo
 *
 * Papel Didático:
 * Garante as mesmas regras de integridade do cadastro no momento de edição,
 * ignorando o ano do próprio período letivo que está sendo alterado.
 */
class UpdatePeriodoLetivoRequest extends FormRequest
{
    /**
     * Autoriza apenas Especialistas Pedagógicos e Administradores.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Regras de validação dos campos.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $periodoRoute = $this->route('periodo') ?? $this->route('periodo_letivo');
        $periodoId = is_object($periodoRoute) ? $periodoRoute->id_periodo_letivo : $periodoRoute;

        return [
            'ano' => [
                'required',
                'integer',
                'between:2000,2100',
                Rule::unique('periodos_letivos', 'ano')->ignore($periodoId, 'id_periodo_letivo'),
            ],
            'tipo_divisao' => ['required', 'string', 'in:bimestre,trimestre,semestre'],
            'total_pontos' => ['required', 'numeric', 'min:1', 'max:1000'],
            'data_inicio' => ['required', 'date_format:Y-m-d'],
            'data_fim' => ['required', 'date_format:Y-m-d', 'after_or_equal:data_inicio'],
            'ativo' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:planejado,em_andamento,encerrado'],
            'divisoes' => ['required', 'array', 'min:2'],
            'divisoes.*.id_divisao' => ['nullable', 'integer'],
            'divisoes.*.numero' => ['required', 'integer', 'min:1'],
            'divisoes.*.nome' => ['required', 'string', 'max:100'],
            'divisoes.*.pontos' => ['required', 'numeric', 'min:0.01'],
            'divisoes.*.data_inicio' => ['required', 'date_format:Y-m-d', 'after_or_equal:data_inicio', 'before_or_equal:data_fim'],
            'divisoes.*.data_fim' => ['required', 'date_format:Y-m-d', 'after_or_equal:divisoes.*.data_inicio', 'before_or_equal:data_fim'],
            'divisoes.*.ordem' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Validações contextuais adicionais.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $tipo = $this->input('tipo_divisao');
            $divisoes = (array) $this->input('divisoes', []);
            $totalPontos = (float) $this->input('total_pontos', 0);

            $qtdEsperada = match ($tipo) {
                'bimestre' => 4,
                'trimestre' => 3,
                'semestre' => 2,
                default => null,
            };

            if ($qtdEsperada !== null && count($divisoes) !== $qtdEsperada) {
                $validator->errors()->add(
                    'divisoes',
                    "Para a divisão do tipo '{$tipo}', devem ser informadas exatamente {$qtdEsperada} etapas."
                );
            }

            $somaPontos = array_sum(array_map(fn ($d) => (float) ($d['pontos'] ?? 0), $divisoes));
            if (abs($somaPontos - $totalPontos) > 0.01) {
                $validator->errors()->add(
                    'total_pontos',
                    "A soma dos pontos das divisões ({$somaPontos} pts) deve ser exatamente igual ao total de pontos do período ({$totalPontos} pts)."
                );
            }
        });
    }

    /**
     * Mensagens de erro em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ano.required' => 'O ano letivo é obrigatório.',
            'ano.unique' => 'Já existe um período letivo cadastrado para este ano.',
            'ano.between' => 'O ano letivo deve estar entre 2000 e 2100.',
            'tipo_divisao.required' => 'O tipo de divisão (bimestre, trimestre ou semestre) é obrigatório.',
            'tipo_divisao.in' => 'O tipo de divisão deve ser bimestre, trimestre ou semestre.',
            'total_pontos.required' => 'A pontuação total do período letivo é obrigatória.',
            'data_inicio.required' => 'A data de início do ano letivo é obrigatória.',
            'data_fim.required' => 'A data de fim do ano letivo é obrigatória.',
            'data_fim.after_or_equal' => 'A data de fim do ano letivo deve ser posterior ou igual à data de início.',
            'divisoes.required' => 'As divisões do ano letivo devem ser informadas.',
            'divisoes.*.nome.required' => 'O nome da divisão (ex: 1º Trimestre) é obrigatório.',
            'divisoes.*.pontos.required' => 'O valor de pontos da divisão é obrigatório.',
            'divisoes.*.data_inicio.required' => 'A data de início da divisão é obrigatória.',
            'divisoes.*.data_fim.required' => 'A data de término da divisão é obrigatória.',
        ];
    }
}
