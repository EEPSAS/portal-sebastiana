<?php

namespace App\Policies;

use App\Models\RemessaDocente;
use App\Models\User;

class RemessaDocentePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, RemessaDocente $remessa): bool
    {
        return $user->canManageAcademic() || $remessa->professor_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function updateStatus(User $user, RemessaDocente $remessa): bool
    {
        return $user->canManageAcademic();
    }
}
