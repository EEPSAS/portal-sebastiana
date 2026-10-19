<?php

namespace App\Policies;

use App\Models\Turma;
use App\Models\User;

// Política de autorização para o módulo de turmas escolares.
class TurmaPolicy
{
    // Permite que Professores, Especialistas e Administradores consultem a listagem geral de turmas
    public function viewAny(User $user): bool
    {
        return $user->canManageAcademic() || $user->isProfessor();
    }

    // Permite visualizar detalhes da turma ao corpo docente/pedagógico ou ao aluno matriculado ativamente nela
    public function view(User $user, Turma $turma): bool
    {
        if ($user->canManageAcademic() || $user->isProfessor()) {
            return true;
        }

        // Verifica se o estudante possui matrícula ativa na turma consultada
        return $turma->matriculas()
            ->where('usuario_id', $user->id)
            ->where('status_matricula', 'Ativo')
            ->exists();
    }

    // Autoriza criação de turmas apenas para gestores acadêmicos (Especialista e Adm)
    public function create(User $user): bool
    {
        return $user->canManageAcademic();
    }

    // Autoriza edição e matrículas apenas para gestores acadêmicos (Especialista e Adm)
    public function update(User $user, Turma $turma): bool
    {
        return $user->canManageAcademic();
    }

    // Autoriza exclusão de turmas apenas para gestores acadêmicos (Especialista e Adm)
    public function delete(User $user, Turma $turma): bool
    {
        return $user->canManageAcademic();
    }
}
