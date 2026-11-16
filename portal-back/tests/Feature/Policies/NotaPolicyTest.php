<?php

use App\Enums\UserRole;
use App\Models\Nota;
use App\Policies\NotaPolicy;

/**
 * Testes da matriz de permissões da NotaPolicy.
 */
test('NotaPolicy permite ao aluno consultar apenas sua propria nota e restringe gestao ao Especialista e Adm', function (UserRole $papel, bool $podeGerenciar) {
    $usuario = criarUsuarioComPapel($papel);
    $outroAluno = criarUsuarioComPapel(UserRole::ALUNO);
    $notaAlheia = Nota::factory()->create(['usuario_id' => $outroAluno->id]);
    $notaPropria = Nota::factory()->create(['usuario_id' => $usuario->id]);

    $policy = new NotaPolicy;

    expect($policy->viewAny($usuario))->toBeTrue()
        ->and($policy->manage($usuario))->toBe($podeGerenciar)
        ->and($policy->view($usuario, $notaAlheia))->toBe($podeGerenciar)
        ->and($policy->view($usuario, $notaPropria))->toBeTrue();
})->with([
    'administrador' => [UserRole::ADM, true],
    'especialista' => [UserRole::ESPECIALISTA, true],
    'professor' => [UserRole::PROFESSOR, false],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, false],
    'aluno' => [UserRole::ALUNO, false],
]);
