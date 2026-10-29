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

    // Permite visualizar detalhes da turma ao Especialista/Adm, ao Professor (se lecionar na turma) ou ao Aluno matriculado
    public function view(User $user, Turma $turma): bool
    {
        if ($user->canManageAcademic()) {
            return true;
        }

        // Isolamento docente: professor só visualiza turmas onde leciona diretamente
        if ($user->isProfessor()) {
            return $turma->turmaDisciplinas()->where('professor_id', $user->id)->exists()
                || $user->disciplinasDocente()->whereHas('turmas', fn ($q) => $q->where('turmas.id_turma', $turma->id_turma))->exists();
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
