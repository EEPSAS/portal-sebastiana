<?php

namespace App\Policies;

use App\Models\Emprestimo;
use App\Models\User;

class EmprestimoPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Emprestimo $emprestimo): bool
    {
        return $user->canManageLibrary() || $emprestimo->usuario_id === $user->id;
    }

    /**
     * Determine whether the user can request a loan.
     */
    public function solicitar(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can approve a loan.
     */
    public function aprovar(User $user, Emprestimo $emprestimo): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can renew a loan.
     */
    public function renovar(User $user, Emprestimo $emprestimo): bool
    {
        return $user->canManageLibrary() || $emprestimo->usuario_id === $user->id;
    }

    /**
     * Determine whether the user can register a return.
     */
    public function devolver(User $user, Emprestimo $emprestimo): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can update the status of the loan.
     */
    public function atualizarStatus(User $user, Emprestimo $emprestimo): bool
    {
        return $user->canManageLibrary();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Emprestimo $emprestimo): bool
    {
        return $user->canManageLibrary();
    }
}
