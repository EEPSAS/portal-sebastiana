<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;

/**
 * EventoPolicy - Política de Autorização do Calendário Escolar (Módulo 4)
 *
 * Papel Didático:
 * Garante que:
 * - A listagem de eventos institucionais seja acessível tanto no Portal Público quanto no Dashboard;
 * - Qualquer usuário autenticado possa criar seus próprios eventos pessoais;
 * - Eventos pessoais só possam ser visualizados, editados ou excluídos pelo seu próprio autor
 *   (ou por gestores com permissão global sobre o calendário).
 */
class EventoPolicy
{
    /**
     * Permite acesso à listagem de eventos (filtrada no Controller conforme autenticação).
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Permite visualização se o evento for institucional (Especialista/Adm) ou de autoria do próprio usuário.
     */
    public function view(?User $user, Evento $evento): bool
    {
        if ($user && ($user->canManageEvents() || $evento->criador_id === $user->id)) {
            return true;
        }

        $criador = $evento->criador;
        if ($criador) {
            return $criador->isEspecialista() || $criador->isAdm();
        }

        return $evento->criador_id === null;
    }

    /**
     * Permite que qualquer usuário autenticado cadastre eventos pessoais (ou institucionais, se Especialista/Adm).
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Autoriza edição se o usuário gerencia eventos globais ou se é o próprio criador do evento.
     */
    public function update(User $user, Evento $evento): bool
    {
        return $user->canManageEvents() || $evento->criador_id === $user->id;
    }

    /**
     * Autoriza exclusão se o usuário gerencia eventos globais ou se é o próprio criador do evento.
     */
    public function delete(User $user, Evento $evento): bool
    {
        return $user->canManageEvents() || $evento->criador_id === $user->id;
    }
}
