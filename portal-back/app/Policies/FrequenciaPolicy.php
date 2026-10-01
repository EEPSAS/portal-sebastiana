<?php

namespace App\Policies;

use App\Models\Frequencia;
use App\Models\User;

class FrequenciaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Frequencia $frequencia): bool
    {
        return $user->canManageAcademic() || $frequencia->usuario_id === $user->id;
    }

    public function manage(User $user): bool
    {
        return $user->canManageAcademic();
    }
}
