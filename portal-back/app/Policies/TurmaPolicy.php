<?php

namespace App\Policies;

use App\Models\Turma;
use App\Models\User;

// Política de autorização para o módulo de turmas escolares.
class TurmaPolicy
{
    // Permite que qualquer usuário autenticado liste turmas
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite que qualquer usuário autenticado visualize detalhes da turma
    public function view(User $user, Turma $turma): bool
    {
        return true;
    }

    // Autoriza criação de turmas apenas para gestores acadêmicos
    public function create(User $user): bool
    {
        return $user->canManageAcademic();
    }

    // Autoriza edição e matrículas apenas para gestores acadêmicos
    public function update(User $user, Turma $turma): bool
    {
        return $user->canManageAcademic();
    }

    // Autoriza exclusão de turmas apenas para gestores acadêmicos
    public function delete(User $user, Turma $turma): bool
    {
        return $user->canManageAcademic();
    }
}
