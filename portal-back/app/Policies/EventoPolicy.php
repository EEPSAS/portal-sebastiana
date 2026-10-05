<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;

// Política de autorização para o módulo de eventos escolares.
class EventoPolicy
{
    // Permite que qualquer usuário autenticado acesse a listagem de eventos
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite visualização se o usuário gerencia eventos, se é o criador ou se o evento foi criado por especialista/admin
    public function view(User $user, Evento $evento): bool
    {
        if ($user->canManageEvents()) {
            return true;
        }

        if ($evento->criador_id === $user->id) {
            return true;
        }

        $criador = $evento->criador;
        if ($criador) {
            return $criador->isEspecialista() || $criador->isAdm();
        }

        return false;
    }

    // Permite que qualquer usuário autenticado cadastre seus próprios eventos
    public function create(User $user): bool
    {
        return true;
    }

    // Autoriza edição se o usuário gerencia eventos globais ou se é o autor do evento
    public function update(User $user, Evento $evento): bool
    {
        return $user->canManageEvents() || $evento->criador_id === $user->id;
    }

    // Autoriza exclusão se o usuário gerencia eventos globais ou se é o autor do evento
    public function delete(User $user, Evento $evento): bool
    {
        return $user->canManageEvents() || $evento->criador_id === $user->id;
    }
}
