<?php

use App\Enums\UserRole;
use App\Models\User;

/**
 * Testes unitários dos métodos de verificação de papel e escopo gerencial no Model User.
 * Não dependem de banco de dados ao instanciar o model em memória com make().
 */
test('User identifica corretamente cada papel institucional em memoria', function () {
    $aluno = User::factory()->make(['role' => UserRole::ALUNO]);
    $padrao = User::factory()->make(['role' => UserRole::PADRAO]);
    $professor = User::factory()->make(['role' => UserRole::PROFESSOR]);
    $bibliotecaria = User::factory()->make(['role' => UserRole::BIBLIOTECARIA]);
    $especialista = User::factory()->make(['role' => UserRole::ESPECIALISTA]);
    $adm = User::factory()->make(['role' => UserRole::ADM]);

    // Aluno e papel legado 'padrao' são reconhecidos como isAluno()
    expect($aluno->isAluno())->toBeTrue()
        ->and($padrao->isAluno())->toBeTrue()
        ->and($professor->isProfessor())->toBeTrue()
        ->and($bibliotecaria->isBibliotecaria())->toBeTrue()
        ->and($especialista->isEspecialista())->toBeTrue()
        ->and($adm->isAdm())->toBeTrue();
});

test('User calcula escopos gerenciais padrao por papel quando sem permissoes customizadas no banco', function () {
    $aluno = User::factory()->make(['role' => UserRole::ALUNO]);
    $professor = User::factory()->make(['role' => UserRole::PROFESSOR]);
    $bibliotecaria = User::factory()->make(['role' => UserRole::BIBLIOTECARIA]);
    $especialista = User::factory()->make(['role' => UserRole::ESPECIALISTA]);
    $adm = User::factory()->make(['role' => UserRole::ADM]);

    // Administrador e Especialista gerenciam o acadêmico, biblioteca e eventos por padrão
    expect($adm->canManageAcademic())->toBeTrue()
        ->and($adm->canManageLibrary())->toBeTrue()
        ->and($adm->canManageEvents())->toBeTrue()
        ->and($especialista->canManageAcademic())->toBeTrue()
        ->and($especialista->canManageLibrary())->toBeTrue()
        ->and($especialista->canManageEvents())->toBeTrue();

    // Bibliotecária gerencia a biblioteca, mas não o acadêmico nem eventos globais
    expect($bibliotecaria->canManageLibrary())->toBeTrue()
        ->and($bibliotecaria->canManageAcademic())->toBeFalse()
        ->and($bibliotecaria->canManageEvents())->toBeFalse();

    // Professor e Aluno não possuem escopos de gestão administrativa
    expect($professor->canManageAcademic())->toBeFalse()
        ->and($professor->canManageLibrary())->toBeFalse()
        ->and($aluno->canManageAcademic())->toBeFalse()
        ->and($aluno->canManageLibrary())->toBeFalse()
        ->and($aluno->canManageEvents())->toBeFalse();
});
