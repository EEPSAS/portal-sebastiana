<?php

use App\Enums\UserRole;
use App\Models\Evento;
use App\Policies\EventoPolicy;

/**
 * Testes da matriz de visibilidade e gestão da EventoPolicy (público, pessoal, docente e institucional).
 */
test('EventoPolicy permite visualizacao publica apenas para eventos institucionais e protege eventos privados', function () {
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);
    $professor = criarUsuarioComPapel(UserRole::PROFESSOR);
    $alunoAutor = criarUsuarioComPapel(UserRole::ALUNO);
    $outroAluno = criarUsuarioComPapel(UserRole::ALUNO);

    $eventoInstitucional = Evento::factory()->create(['criador_id' => $especialista->id]);
    $eventoDocente = Evento::factory()->create(['criador_id' => $professor->id]);
    $eventoPrivadoAluno = Evento::factory()->create(['criador_id' => $alunoAutor->id]);

    $policy = new EventoPolicy;

    // Visitante anônimo (null) enxerga apenas eventos institucionais
    expect($policy->viewAny(null))->toBeTrue()
        ->and($policy->view(null, $eventoInstitucional))->toBeTrue()
        ->and($policy->view(null, $eventoDocente))->toBeFalse()
        ->and($policy->view(null, $eventoPrivadoAluno))->toBeFalse();

    // Usuário autenticado enxerga eventos institucionais e de professores, mas não eventos privados de outro aluno
    expect($policy->view($outroAluno, $eventoInstitucional))->toBeTrue()
        ->and($policy->view($outroAluno, $eventoDocente))->toBeTrue()
        ->and($policy->view($outroAluno, $eventoPrivadoAluno))->toBeFalse()
        ->and($policy->view($alunoAutor, $eventoPrivadoAluno))->toBeTrue();
});

test('EventoPolicy autoriza edicao e exclusao apenas ao proprio autor ou gestores de eventos', function (UserRole $papel, bool $gerenciaGlobal) {
    $usuario = criarUsuarioComPapel($papel);
    $outroAutor = criarUsuarioComPapel(UserRole::ALUNO);
    $eventoAlheio = Evento::factory()->create(['criador_id' => $outroAutor->id]);
    $eventoProprio = Evento::factory()->create(['criador_id' => $usuario->id]);

    $policy = new EventoPolicy;

    expect($policy->create($usuario))->toBeTrue()
        ->and($policy->update($usuario, $eventoProprio))->toBeTrue()
        ->and($policy->delete($usuario, $eventoProprio))->toBeTrue()
        ->and($policy->update($usuario, $eventoAlheio))->toBe($gerenciaGlobal)
        ->and($policy->delete($usuario, $eventoAlheio))->toBe($gerenciaGlobal);
})->with([
    'administrador' => [UserRole::ADM, true],
    'especialista' => [UserRole::ESPECIALISTA, true],
    'professor' => [UserRole::PROFESSOR, false],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, false],
    'aluno' => [UserRole::ALUNO, false],
]);
