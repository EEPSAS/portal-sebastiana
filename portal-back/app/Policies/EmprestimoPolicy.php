<?php

namespace App\Policies;

use App\Models\Emprestimo;
use App\Models\User;

// Política de autorização para o fluxo de empréstimos da biblioteca.
class EmprestimoPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    // Autoriza listagem geral de empréstimos para quem gerencia a biblioteca
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('visualizar_historico_global_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Determine whether the user can view the model.
     */
    // Autoriza visualização se o usuário gerencia a biblioteca ou é o solicitante
    public function view(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca')
            || $emprestimo->usuario_id === $user->id;
    }

    /**
     * Determine whether the user can request a loan.
     */
    // Autoriza solicitação se possuir a habilidade solicitar_emprestimo
    public function solicitar(User $user): bool
    {
        return $user->hasPermissionTo('solicitar_emprestimo');
    }

    /**
     * Determine whether the user can approve a loan.
     */
    // Autoriza aprovação para gestores da biblioteca
    public function aprovar(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Determine whether the user can renew a loan.
     */
    // Autoriza renovação para gestores ou para o próprio usuário solicitante
    public function renovar(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca')
            || ($emprestimo->usuario_id === $user->id && $user->hasPermissionTo('solicitar_emprestimo'));
    }

    /**
     * Determine whether the user can register a return.
     */
    // Autoriza registro de devolução para gestores da biblioteca
    public function devolver(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Determine whether the user can update the status of the loan.
     */
    // Autoriza alteração manual de status para gestores da biblioteca
    public function atualizarStatus(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Determine whether the user can delete the model.
     */
    // Autoriza cancelamento/exclusão para gestores da biblioteca
    public function delete(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }
}
