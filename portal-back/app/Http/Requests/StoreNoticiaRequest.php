<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreNoticiaRequest - Validação de Entrada para Cadastro de Notícia
 *
 * Papel Didático:
 * Garante que usuários autenticados autorizados (Especialistas, Administradores
 * e usuários com habilidade de criação de comunicados) possam cadastrar notícias,
 * validando tipagem e obrigatoriedade antes de chegar ao Controller.
 */
class StoreNoticiaRequest extends FormRequest
{
    /**
     * Determina se o usuário autenticado tem permissão para cadastrar notícias.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        // Administrador e Especialista possuem permissão ampla de gestão
        if ($user->isAdm() || $user->isEspecialista() || $user->hasPermissionTo('gerenciar_noticias')) {
            return true;
        }

        // Permite cadastro se o usuário possuir a habilidade explícita de publicação
        return $user->hasPermissionTo('criar_noticia');
    }

    /**
     * Regras de validação aplicadas aos campos da requisição.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'conteudo' => ['required', 'string'],
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
            'titulo.required' => 'O título da notícia é obrigatório.',
            'titulo.max' => 'O título da notícia não pode ultrapassar 255 caracteres.',
            'conteudo.required' => 'O conteúdo completo da notícia é obrigatório.',
            'descricao.max' => 'A descrição/resumo não pode ultrapassar 500 caracteres.',
        ];
    }
}
