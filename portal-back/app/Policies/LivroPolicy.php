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
    // Autoriza cadastro de novos livros para gestores da biblioteca
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('gerenciar_livros') || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Determine whether the user can update the model.
     */
    // Autoriza edição dos dados do livro para gestores da biblioteca
    public function update(User $user, Livro $livro): bool
    {
        return $user->hasPermissionTo('gerenciar_livros') || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Determine whether the user can delete the model.
     */
    // Autoriza exclusão de livros do acervo para gestores da biblioteca
    public function delete(User $user, Livro $livro): bool
    {
        return $user->hasPermissionTo('gerenciar_livros') || $user->hasPermissionTo('gerenciar_biblioteca');
    }
}
