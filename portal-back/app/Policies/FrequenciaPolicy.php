<?php

namespace App\Policies;

use App\Models\Frequencia;
use App\Models\User;

// Política de autorização para o módulo de frequência e chamadas.
class FrequenciaPolicy
{
    // Permite listagem geral para usuários autenticados
    public function viewAny(User $user): bool
    {
        return true;
    }

    // Permite visualização se gerencia o acadêmico ou se a frequência pertence ao aluno
    public function view(User $user, Frequencia $frequencia): bool
    {
        return $user->canManageAcademic() || $frequencia->usuario_id === $user->id;
    }

    // Autoriza consolidação e gestão de frequências apenas para gestores acadêmicos
    public function manage(User $user): bool
    {
        return $user->canManageAcademic();
    }
}
