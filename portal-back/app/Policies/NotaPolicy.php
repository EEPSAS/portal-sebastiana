<?php

namespace App\Policies;

use App\Models\Nota;
use App\Models\User;

class NotaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Nota $nota): bool
    {
        return $user->canManageAcademic() || $nota->usuario_id === $user->id;
    }

    public function manage(User $user): bool
    {
        return $user->canManageAcademic();
    }
}
