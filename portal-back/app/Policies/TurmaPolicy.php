<?php

namespace App\Policies;

use App\Models\Turma;
use App\Models\User;

class TurmaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Turma $turma): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->canManageAcademic();
    }

    public function update(User $user, Turma $turma): bool
    {
        return $user->canManageAcademic();
    }

    public function delete(User $user, Turma $turma): bool
    {
        return $user->canManageAcademic();
    }
}
