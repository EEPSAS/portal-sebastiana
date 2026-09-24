<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;

class EventoPolicy
{
    // Permite que qualquer usuario autenticado liste os eventos
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite que qualquer usuario autenticado visualize um evento especifico
    public function view(User $user, Evento $evento): bool
    {
        return true;
    }

    // Autoriza a criacao se o usuario for administrador ou editor
    public function create(User $user): bool
    {
        return $user->canManageEvents();
    }

    // Autoriza a edicao se o usuario for administrador ou editor
    public function update(User $user, Evento $evento): bool
    {
        return $user->canManageEvents();
    }

    // Autoriza a exclusao se o usuario for administrador ou editor
    public function delete(User $user, Evento $evento): bool
    {
        return $user->canManageEvents();
    }
}