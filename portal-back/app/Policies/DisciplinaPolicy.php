<?php

namespace App\Policies;

use App\Models\Disciplina;
use App\Models\User;

// Política de autorização para o módulo de disciplinas escolares.
class DisciplinaPolicy
{
    // Permite que qualquer usuário autenticado liste disciplinas
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite que qualquer usuário autenticado visualize detalhes da disciplina
    public function view(User $user, Disciplina $disciplina): bool
    {
        return true;
    }

    // Autoriza criação apenas para quem gerencia o acadêmico
    public function create(User $user): bool
    {
        return $user->canManageAcademic();
    }

    // Autoriza edição apenas para quem gerencia o acadêmico
    public function update(User $user, Disciplina $disciplina): bool
    {
        return $user->canManageAcademic();
    }

    // Autoriza exclusão apenas para quem gerencia o acadêmico
    public function delete(User $user, Disciplina $disciplina): bool
    {
        return $user->canManageAcademic();
    }
}
