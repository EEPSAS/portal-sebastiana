<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoticiaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageEvents() ?? false;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'conteudo' => ['required', 'string'],
            'categoria' => ['nullable', 'string', 'max:100'],
            'url_foto' => ['nullable', 'url', 'max:2048'],
            'url_miniatura' => ['nullable', 'url', 'max:2048'],
            'data_publicacao' => ['nullable', 'date'],
            'destaque' => ['nullable', 'boolean'],
        ];
    }
}