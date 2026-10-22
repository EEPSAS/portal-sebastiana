<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;

/**
 * EventoPolicy - Política de Autorização do Calendário Escolar (Módulo 4)
 *
 * Papel Didático:
 * Garante que:
 * - Eventos institucionais sejam acessíveis no Portal Público e eventos de Professor no Dashboard;
 * - Qualquer usuário autenticado possa criar seus próprios eventos pessoais;
 * - Eventos de Aluno/Bibliotecária sejam privados e eventos compartilhados de Professor só sejam lidos por usuários logados;
 * - Edição e exclusão continuem restritas ao autor ou a gestores com permissão global sobre o calendário.
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
     * Permite visualização de eventos institucionais, de Professor entre usuários logados ou do próprio autor.
     */
    public function view(?User $user, Evento $evento): bool
    {
        if ($user && ($user->canManageEvents() || $evento->criador_id === $user->id)) {
            return true;
        }

        $criador = $evento->criador;
        if ($criador) {
            return $criador->isEspecialista()
                || $criador->isAdm()
                || ($user !== null && $criador->isProfessor());
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
