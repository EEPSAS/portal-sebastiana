<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateNoticiaRequest - Validação de Entrada para Edição de Notícia
 *
 * Papel Didático:
 * Protege a rota PUT/PATCH /api/noticias/{id}. Especialistas e Administradores
 * podem gerenciar qualquer notícia. Demais usuários podem editar apenas
 * notícias de sua própria autoria.
 */
class UpdateNoticiaRequest extends FormRequest
{
    /**
     * Determina se o usuário autenticado tem autorização para editar notícias.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        // Administrador e Especialista possuem gestão ampla
        if ($user->isAdm() || $user->isEspecialista() || $user->hasPermissionTo('gerenciar_noticias')) {
            return true;
        }

        $noticia = $this->route('noticia');

        // Permite edição apenas se a notícia for de autoria do próprio usuário
        return $user->hasPermissionTo('editar_noticia_propria')
            && $noticia !== null
            && (int) $noticia->autor_id === (int) $user->id;
    }

    /**
     * Regras de validação para os campos atualizáveis.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'conteudo' => ['sometimes', 'required', 'string'],
            'categoria' => ['nullable', 'string', 'in:Geral,Avisos,Pedagógico,Eventos,Biblioteca,Projetos'],
            'url_foto' => ['nullable', 'string', 'max:2048'],
            'url_miniatura' => ['nullable', 'string', 'max:2048'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            'miniatura_arquivo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            'data_publicacao' => ['nullable', 'date'],
            'destaque' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Mensagens de validação amigáveis em português.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'titulo.required' => 'O título da notícia não pode ficar em branco.',
            'titulo.max' => 'O título da notícia não pode ultrapassar 255 caracteres.',
            'conteudo.required' => 'O conteúdo completo da notícia não pode ficar em branco.',
            'descricao.max' => 'A descrição/resumo não pode ultrapassar 500 caracteres.',
        ];
    }
}
