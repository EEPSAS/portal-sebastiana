<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para publicação de novas notícias no portal.
class StoreNoticiaRequest extends FormRequest
{
    // Autoriza se o usuário tem permissão para criar ou gerenciar notícias
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->hasPermissionTo('criar_noticia') || $user->hasPermissionTo('gerenciar_noticias'));
    }

    // Regras de validação do conteúdo da notícia
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
