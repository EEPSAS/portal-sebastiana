<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AvaliarSubmissaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $submissao = $this->route('submissao');

        return $this->user() !== null && $submissao !== null && $this->user()->can('avaliar', $submissao);
    }

    public function rules(): array
    {
        return [
            'nota_atribuida' => ['required', 'numeric', 'min:0'],
            'feedback_comentario_professor' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
