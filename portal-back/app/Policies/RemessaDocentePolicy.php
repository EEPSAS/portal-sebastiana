<?php

namespace App\Policies;

use App\Models\RemessaDocente;
use App\Models\User;

// Política de autorização para o canal de remessas docentes.
class RemessaDocentePolicy
{
    // Permite listagem geral para usuários autenticados
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite visualização se gerencia o acadêmico ou se a remessa é de sua autoria
    public function view(User $user, RemessaDocente $remessa): bool
    {
        return $user->canManageAcademic() || $remessa->professor_id === $user->id;
    }

    // Permite que docentes autenticados enviem remessas (vínculo checado no controller)
    public function create(User $user): bool
    {
        return true;
    }

    // Autoriza processamento de status (anexar/rejeitar) apenas para gestores acadêmicos
    public function updateStatus(User $user, RemessaDocente $remessa): bool
    {
        return $user->canManageAcademic();
    }
}
