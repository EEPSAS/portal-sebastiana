<?php

use App\Enums\UserRole;
use App\Models\Frequencia;
use App\Policies\FrequenciaPolicy;

/**
 * Testes da matriz de permissões da FrequenciaPolicy.
 */
test('FrequenciaPolicy restringe gestao a Especialista e Adm e permite ao aluno ver apenas sua propria frequencia', function (UserRole $papel, bool $podeGerenciar) {
    $usuario = criarUsuarioComPapel($papel);
    $alunoTitular = criarUsuarioComPapel(UserRole::ALUNO);
    $frequenciaAlheia = Frequencia::factory()->create(['usuario_id' => $alunoTitular->id]);
    $frequenciaPropria = Frequencia::factory()->create(['usuario_id' => $usuario->id]);

    $policy = new FrequenciaPolicy;

    expect($policy->viewAny($usuario))->toBeTrue()
        ->and($policy->manage($usuario))->toBe($podeGerenciar)
        ->and($policy->view($usuario, $frequenciaAlheia))->toBe($podeGerenciar)
        ->and($policy->view($usuario, $frequenciaPropria))->toBeTrue();
})->with([
    'administrador' => [UserRole::ADM, true],
    'especialista' => [UserRole::ESPECIALISTA, true],
    'professor' => [UserRole::PROFESSOR, false],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, false],
    'aluno' => [UserRole::ALUNO, false],
]);
