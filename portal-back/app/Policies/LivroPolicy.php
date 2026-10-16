<?php

namespace App\Policies;

use App\Models\Livro;
use App\Models\User;

// Política de autorização para o acervo de livros da biblioteca.
class LivroPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    // Permite visualização pública da listagem de livros
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    // Permite visualização pública dos detalhes de um livro
    public function view(?User $user, Livro $livro): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    // Autoriza cadastro e importação CSV de livros apenas para Bibliotecária, Especialista e Adm
    public function create(User $user): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can update the model.
     */
    // Autoriza edição dos dados do livro apenas para Bibliotecária, Especialista e Adm
    public function update(User $user, Livro $livro): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can delete the model.
     */
    // Autoriza exclusão de livros do acervo apenas para Bibliotecária, Especialista e Adm
    public function delete(User $user, Livro $livro): bool
    {
        return $user->canManageLibrary();
    }
}
