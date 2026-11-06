<?php

namespace App\Policies;

use App\Enums\EmprestimoStatus;
use App\Models\Emprestimo;
use App\Models\User;

/**
 * EmprestimoPolicy - Política de Autorização para Empréstimos de Livros
 *
 * Papel Didático:
 * Garante o isolamento de dados entre leitores (que só visualizam e renovam
 * seus próprios empréstimos) e gestores da biblioteca (Bibliotecária, Especialista e Adm),
 * que aprovam retiradas e registram devoluções no balcão.
 */
class EmprestimoPolicy
{
    /**
     * Autoriza a listagem global de empréstimos para gestores da biblioteca.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('visualizar_historico_global_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Autoriza a visualização de um empréstimo se o usuário for gestor ou o próprio leitor solicitante.
     */
    public function view(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca')
            || $emprestimo->usuario_id === $user->id;
    }

    /**
     * Autoriza a abertura de solicitação de empréstimo para usuários com a permissão correspondente.
     */
    public function solicitar(User $user): bool
    {
        return $user->hasPermissionTo('solicitar_emprestimo');
    }

    /**
     * Autoriza o titular a liberar somente uma solicitação ainda pendente.
     */
    public function cancelar(User $user, Emprestimo $emprestimo): bool
    {
        return $emprestimo->usuario_id === $user->id
            && $emprestimo->status === EmprestimoStatus::SOLICITADO;
    }

    /**
     * Autoriza o registro de entrega física do exemplar apenas para gestores da biblioteca.
     */
    public function entregar(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Mantém alias de compatibilidade apontando para a mesma regra de entrega física.
     */
    public function aprovar(User $user, Emprestimo $emprestimo): bool
    {
        return $this->entregar($user, $emprestimo);
    }

    /**
     * Autoriza a renovação de prazo para gestores ou para o próprio leitor titular do empréstimo.
     */
    public function renovar(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca')
            || ($emprestimo->usuario_id === $user->id && $user->hasPermissionTo('solicitar_emprestimo'));
    }

    /**
     * Autoriza a baixa de devolução do exemplar apenas para gestores da biblioteca.
     */
    public function devolver(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Autoriza a alteração administrativa de status apenas para gestores da biblioteca.
     */
    public function atualizarStatus(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }

    /**
     * Autoriza a exclusão de registros de empréstimo apenas para gestores da biblioteca.
     */
    public function delete(User $user, Emprestimo $emprestimo): bool
    {
        return $user->hasPermissionTo('gerenciar_emprestimos')
            || $user->hasPermissionTo('gerenciar_biblioteca');
    }
}
