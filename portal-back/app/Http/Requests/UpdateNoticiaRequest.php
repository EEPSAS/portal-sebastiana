<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para edição de notícias no portal.
class UpdateNoticiaRequest extends FormRequest
{
    // Autoriza se o usuário pode gerenciar todas as notícias ou editar sua própria notícia
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if ($user->hasPermissionTo('gerenciar_noticias')) {
            return true;
        }

        $noticia = $this->route('noticia');

        return $user->hasPermissionTo('editar_noticia_propria')
            && $noticia !== null
            && $noticia->autor_id === $user->id;
    }

    // Regras de validação para os campos atualizáveis da notícia
    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'conteudo' => ['sometimes', 'required', 'string'],
            'categoria' => ['nullable', 'string', 'max:100'],
            'url_foto' => ['nullable', 'url', 'max:2048'],
            'url_miniatura' => ['nullable', 'url', 'max:2048'],
            'data_publicacao' => ['nullable', 'date'],
            'destaque' => ['nullable', 'boolean'],
        ];
    }
}
