<?php

namespace App\Policies;

use App\Models\Livro;
use App\Models\User;

/**
 * LivroPolicy - Política de Autorização do Catálogo de Livros
 *
 * Papel Didático:
 * Define quem pode consultar e quem pode alterar o acervo físico escolar.
 * A consulta é pública (`?User $user`), enquanto operações de escrita (CRUD e CSV)
 * exigem permissão de gestão da biblioteca (`canManageLibrary()`).
 */
class LivroPolicy
{
    /**
     * Determina se qualquer visitante ou usuário logado pode listar os livros do acervo.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determina se qualquer visitante ou usuário logado pode ver os detalhes de um livro.
     */
    public function view(?User $user, Livro $livro): bool
    {
        return true;
    }

    /**
     * Autoriza o cadastro individual e a importação CSV apenas para Bibliotecária, Especialista e Adm.
     */
    public function create(User $user): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Autoriza a edição dos dados cadastrais do livro apenas para gestores da biblioteca.
     */
    public function update(User $user, Livro $livro): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Autoriza a remoção de exemplares do acervo apenas para gestores da biblioteca.
     */
    public function delete(User $user, Livro $livro): bool
    {
        return $user->canManageLibrary();
    }
}
