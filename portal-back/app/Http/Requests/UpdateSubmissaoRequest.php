<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubmissaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $submissao = $this->route('submissao');

        return $this->user() !== null && $submissao !== null && $this->user()->can('update', $submissao);
    }

    public function rules(): array
    {
        return [
            'texto_resposta' => ['nullable', 'string'],
            'arquivo' => ['nullable', 'file', 'max:10240'],
            'remover_arquivo' => ['nullable', 'boolean'],
        ];
    }
}
