<?php

namespace App\Http\Requests;

use App\Models\Submissao;
use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('create', Submissao::class);
    }

    public function rules(): array
    {
        return [
            'texto_resposta' => ['nullable', 'string', 'required_without:arquivo'],
            'arquivo' => ['nullable', 'file', 'max:10240', 'required_without:texto_resposta'],
        ];
    }

    public function messages(): array
    {
        return [
            'texto_resposta.required_without' => 'Informe o texto de resposta ou anexe um arquivo para a entrega.',
            'arquivo.required_without' => 'Informe o texto de resposta ou anexe um arquivo para a entrega.',
        ];
    }
}
