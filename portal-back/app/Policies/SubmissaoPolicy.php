<?php

namespace App\Policies;

use App\Models\Atividade;
use App\Models\Submissao;
use App\Models\User;

class SubmissaoPolicy
{
    public function viewAny(User $user, Atividade $atividade): bool
    {
        return $user->isAdm() || $user->id === $atividade->usuario_id || $user->canManageAcademic();
    }

    public function view(User $user, Submissao $submissao): bool
    {
        return $user->id === $submissao->usuario_id
            || $user->isAdm()
            || $user->id === $submissao->atividade->usuario_id
            || $user->canManageAcademic();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Submissao $submissao): bool
    {
        return $user->id === $submissao->usuario_id;
    }

    public function delete(User $user, Submissao $submissao): bool
    {
        return $user->id === $submissao->usuario_id;
    }

    public function avaliar(User $user, Submissao $submissao): bool
    {
        return $user->isAdm()
            || ($user->canManageAcademic() && $user->id === $submissao->atividade->usuario_id);
    }

    public function feedback(User $user, Submissao $submissao): bool
    {
        return $user->isAdm()
            || ($user->canManageAcademic() && $user->id === $submissao->atividade->usuario_id);
    }
}
