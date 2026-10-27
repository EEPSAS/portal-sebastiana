<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MoveHorarioAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && ($this->user()->isAdm() || $this->user()->isEspecialista());
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'destino_dia_semana' => ['required', 'integer', 'between:1,5'],
            'destino_aula_numero' => ['required', 'integer', 'between:1,6'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'destino_dia_semana.required' => 'Informe o dia de destino da aula.',
            'destino_dia_semana.between' => 'O dia deve estar entre segunda-feira e sexta-feira.',
            'destino_aula_numero.required' => 'Informe o período de destino da aula.',
            'destino_aula_numero.between' => 'O período deve estar entre a 1ª e a 6ª aula.',
        ];
    }
}
