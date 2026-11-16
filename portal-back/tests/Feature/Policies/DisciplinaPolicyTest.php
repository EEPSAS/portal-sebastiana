<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Policies\DisciplinaPolicy;

/**
 * Testes da matriz de permissões da DisciplinaPolicy para todos os papéis do sistema.
 */
test('DisciplinaPolicy permite leitura para todos os papeis e restringe escrita a gestores academicos', function (UserRole $papel, bool $podeEscrever) {
    $usuario = criarUsuarioComPapel($papel);
    $disciplina = Disciplina::factory()->create();
    $policy = new DisciplinaPolicy;

    expect($policy->viewAny($usuario))->toBeTrue()
        ->and($policy->view($usuario, $disciplina))->toBeTrue()
        ->and($policy->create($usuario))->toBe($podeEscrever)
        ->and($policy->update($usuario, $disciplina))->toBe($podeEscrever)
        ->and($policy->delete($usuario, $disciplina))->toBe($podeEscrever);
})->with([
    'administrador' => [UserRole::ADM, true],
    'especialista' => [UserRole::ESPECIALISTA, true],
    'professor' => [UserRole::PROFESSOR, false],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, false],
    'aluno' => [UserRole::ALUNO, false],
    'padrao legado' => [UserRole::PADRAO, false],
]);
