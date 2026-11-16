<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Policies\TurmaPolicy;

/**
 * Testes da matriz de permissões e isolamento docente/discente na TurmaPolicy.
 */
test('TurmaPolicy controla listagem geral e operacoes de escrita por papel', function (UserRole $papel, bool $podeListarGeral, bool $podeEscrever) {
    $usuario = criarUsuarioComPapel($papel);
    $turma = Turma::factory()->create();
    $policy = new TurmaPolicy;

    expect($policy->viewAny($usuario))->toBe($podeListarGeral)
        ->and($policy->create($usuario))->toBe($podeEscrever)
        ->and($policy->update($usuario, $turma))->toBe($podeEscrever)
        ->and($policy->delete($usuario, $turma))->toBe($podeEscrever);
})->with([
    'administrador' => [UserRole::ADM, true, true],
    'especialista' => [UserRole::ESPECIALISTA, true, true],
    'professor' => [UserRole::PROFESSOR, true, false],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, false, false],
    'aluno' => [UserRole::ALUNO, false, false],
]);

test('TurmaPolicy isola visualizacao da turma para professor vinculado e aluno com matricula ativa', function () {
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    $profVinculado = criarUsuarioComPapel(UserRole::PROFESSOR);
    $profExterno = criarUsuarioComPapel(UserRole::PROFESSOR);
    TurmaDisciplina::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $profVinculado->id,
    ]);

    $alunoMatriculado = criarUsuarioComPapel(UserRole::ALUNO);
    $alunoCancelado = criarUsuarioComPapel(UserRole::ALUNO);
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoMatriculado->id,
        'status_matricula' => 'Ativo',
    ]);
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoCancelado->id,
        'status_matricula' => 'Cancelado',
    ]);

    $policy = new TurmaPolicy;

    expect($policy->view($profVinculado, $turma))->toBeTrue()
        ->and($policy->view($profExterno, $turma))->toBeFalse()
        ->and($policy->view($alunoMatriculado, $turma))->toBeTrue()
        ->and($policy->view($alunoCancelado, $turma))->toBeFalse();
});
