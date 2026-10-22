<?php

namespace App\Policies;

use App\Models\Atividade;
use App\Models\User;

class AtividadePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Atividade $atividade): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->canManageAcademic();
    }

    public function update(User $user, Atividade $atividade): bool
    {
        return $user->isAdm() || ($user->canManageAcademic() && $user->id === $atividade->usuario_id);
    }

    public function delete(User $user, Atividade $atividade): bool
    {
        return $user->isAdm() || ($user->canManageAcademic() && $user->id === $atividade->usuario_id);
    }

    public function encerrar(User $user, Atividade $atividade): bool
    {
        return $user->isAdm() || ($user->canManageAcademic() && $user->id === $atividade->usuario_id);
    }
}
