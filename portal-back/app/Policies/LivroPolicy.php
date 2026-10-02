<?php

namespace App\Policies;

use App\Models\Livro;
use App\Models\User;

class LivroPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Livro $livro): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Livro $livro): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Livro $livro): bool
    {
        return $user->canManageLibrary();
    }
}
