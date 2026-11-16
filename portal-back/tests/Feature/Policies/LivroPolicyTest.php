<?php

use App\Enums\UserRole;
use App\Models\Livro;
use App\Policies\LivroPolicy;

/**
 * Testes da matriz de permissões da LivroPolicy (consulta pública e escrita restrita à gestão da biblioteca).
 */
test('LivroPolicy permite leitura ate para visitantes anonimos e restringe escrita a gestores da biblioteca', function (UserRole $papel, bool $podeGerenciarAcervo) {
    $usuario = criarUsuarioComPapel($papel);
    $livro = Livro::factory()->create();
    $policy = new LivroPolicy;

    expect($policy->viewAny(null))->toBeTrue()
        ->and($policy->view(null, $livro))->toBeTrue()
        ->and($policy->viewAny($usuario))->toBeTrue()
        ->and($policy->view($usuario, $livro))->toBeTrue()
        ->and($policy->create($usuario))->toBe($podeGerenciarAcervo)
        ->and($policy->update($usuario, $livro))->toBe($podeGerenciarAcervo)
        ->and($policy->delete($usuario, $livro))->toBe($podeGerenciarAcervo);
})->with([
    'administrador' => [UserRole::ADM, true],
    'especialista' => [UserRole::ESPECIALISTA, true],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, true],
    'professor' => [UserRole::PROFESSOR, false],
    'aluno' => [UserRole::ALUNO, false],
    'padrao legado' => [UserRole::PADRAO, false],
]);
