<?php

use App\Enums\UserRole;
use App\Http\Resources\UsuarioResource;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\User;

test('usuario resource inclui o nome da turma ativa quando o usuario for aluno matriculado', function () {
    $aluno = User::factory()->create([
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    $turma = Turma::factory()->create([
        'nome_identificador' => '1º Ano A - Ensino Médio',
        'ano_letivo' => 2026,
    ]);

    Matricula::create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);

    $resource = (new UsuarioResource($aluno))->resolve();

    expect($resource)
        ->toHaveKey('turma', '1º Ano A - Ensino Médio')
        ->toHaveKey('turma_id', $turma->id_turma)
        ->and($resource['role'])->toBe('aluno');
});

test('usuario resource retorna turma como null quando o aluno nao possui matricula ativa', function () {
    $aluno = User::factory()->create([
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    $resource = (new UsuarioResource($aluno))->resolve();

    expect($resource)
        ->toHaveKey('turma', null)
        ->toHaveKey('turma_id', null);
});

test('usuario resource retorna turma como null para usuarios que nao sao alunos', function () {
    $professor = User::factory()->create([
        'role' => UserRole::PROFESSOR,
        'ativo' => true,
    ]);

    $resource = (new UsuarioResource($professor))->resolve();

    expect($resource)
        ->toHaveKey('turma', null)
        ->toHaveKey('turma_id', null);
});

test('endpoint /api/user entrega o campo turma do aluno autenticado', function () {
    $aluno = User::factory()->create([
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    $turma = Turma::factory()->create([
        'nome_identificador' => '3º Ano B - Técnico em Informática',
        'ano_letivo' => 2026,
    ]);

    Matricula::create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);

    $token = $aluno->createToken('portal-front')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/user');

    $response->assertOk()
        ->assertJsonPath('turma', '3º Ano B - Técnico em Informática')
        ->assertJsonPath('turma_id', $turma->id_turma)
        ->assertJsonPath('role', 'aluno');
});

test('login tradicional entrega os dados do aluno com o campo turma', function () {
    $aluno = User::factory()->create([
        'email' => 'estudante.teste@aluno.mg.gov.br',
        'password' => 'secret123456',
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    $turma = Turma::factory()->create([
        'nome_identificador' => '2º Ano A - Regular',
        'ano_letivo' => 2026,
    ]);

    Matricula::create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'estudante.teste@aluno.mg.gov.br',
        'password' => 'secret123456',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.role', 'aluno')
        ->assertJsonPath('user.turma', '2º Ano A - Regular')
        ->assertJsonPath('user.turma_id', $turma->id_turma);
});
