<?php

namespace App\Policies;

use App\Models\Nota;
use App\Models\User;

// Política de autorização para o módulo de notas e avaliações.
class NotaPolicy
{
    // Permite listagem geral para usuários autenticados
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite visualização se gerencia o acadêmico ou se a nota pertence ao aluno
    public function view(User $user, Nota $nota): bool
    {
        return $user->canManageAcademic() || $nota->usuario_id === $user->id;
    }

    // Autoriza lançamento e alterações de notas apenas para gestores acadêmicos
    public function manage(User $user): bool
    {
        return $user->canManageAcademic();
    }
}
