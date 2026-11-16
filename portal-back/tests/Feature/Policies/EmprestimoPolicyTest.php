<?php

use App\Enums\UserRole;
use App\Models\Emprestimo;
use App\Models\Livro;
use App\Models\User;
use App\Policies\EmprestimoPolicy;

/**
 * EmprestimoPolicyTest - Testes da Política de Autorização de Empréstimos
 *
 * Papel Didático:
 * Garante que apenas gestores do acervo aprovem retiradas, deem baixa em devoluções,
 * atualizem status ou removam registros, enquanto leitores podem solicitar, visualizar
 * e renovar apenas os próprios empréstimos.
 */
beforeEach(function () {
    $this->policy = new EmprestimoPolicy;
});

test('EmprestimoPolicy controla listagem global, aprovacao, devolucao, status e exclusao conforme perfil', function (UserRole $role, bool $esperadoGestor) {
    $usuario = criarUsuarioComPapel($role);
    $livro = Livro::factory()->create();
    $emprestimo = Emprestimo::factory()->create([
        'usuario_id' => User::factory()->create()->id,
        'livro_id' => $livro->id_livro,
    ]);

    expect($this->policy->viewAny($usuario))->toBe($esperadoGestor)
        ->and($this->policy->aprovar($usuario, $emprestimo))->toBe($esperadoGestor)
        ->and($this->policy->devolver($usuario, $emprestimo))->toBe($esperadoGestor)
        ->and($this->policy->atualizarStatus($usuario, $emprestimo))->toBe($esperadoGestor)
        ->and($this->policy->delete($usuario, $emprestimo))->toBe($esperadoGestor);
})->with([
    'administrador' => [UserRole::ADM, true],
    'especialista' => [UserRole::ESPECIALISTA, true],
    'bibliotecaria' => [UserRole::BIBLIOTECARIA, true],
    'professor' => [UserRole::PROFESSOR, false],
    'aluno' => [UserRole::ALUNO, false],
]);

test('EmprestimoPolicy permite ao titular solicitar, visualizar e renovar apenas os proprios emprestimos', function () {
    $alunoTitular = criarUsuarioComPapel(UserRole::ALUNO);
    $outroAluno = criarUsuarioComPapel(UserRole::ALUNO);
    $livro = Livro::factory()->create();

    $emprestimo = Emprestimo::factory()->create([
        'usuario_id' => $alunoTitular->id,
        'livro_id' => $livro->id_livro,
        'status' => 'solicitado',
    ]);

    expect($this->policy->solicitar($alunoTitular))->toBeTrue()
        ->and($this->policy->view($alunoTitular, $emprestimo))->toBeTrue()
        ->and($this->policy->view($outroAluno, $emprestimo))->toBeFalse()
        ->and($this->policy->renovar($alunoTitular, $emprestimo))->toBeTrue()
        ->and($this->policy->renovar($outroAluno, $emprestimo))->toBeFalse();
});
