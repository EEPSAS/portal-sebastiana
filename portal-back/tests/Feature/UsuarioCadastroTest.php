<?php

use App\Enums\UserRole;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('administrador visualiza todos os usuarios inclusive pendentes e inativos', function () {
    $admin = User::factory()->create([
        'role' => UserRole::ADM,
        'status_confirmacao' => 'confirmado',
    ]);

    User::factory()->create([
        'name' => 'Aluno Ativo',
        'role' => UserRole::ALUNO,
        'status_confirmacao' => 'confirmado',
    ]);

    User::factory()->create([
        'name' => 'Professor Pendente',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'pendente',
    ]);

    User::factory()->create([
        'name' => 'Aluno Inativo',
        'role' => UserRole::ALUNO,
        'status_confirmacao' => 'inativo',
        'ativo' => false,
    ]);

    Sanctum::actingAs($admin);

    $res = $this->getJson('/api/usuarios');
    $res->assertOk();

    $nomes = collect($res->json('data'))->pluck('name')->all();
    expect($nomes)->toContain($admin->name)
        ->and($nomes)->toContain('Aluno Ativo')
        ->and($nomes)->toContain('Professor Pendente')
        ->and($nomes)->toContain('Aluno Inativo');

    // Filtro por status
    $resPendentes = $this->getJson('/api/usuarios?status=pendente');
    $resPendentes->assertOk();
    $nomesPendentes = collect($resPendentes->json('data'))->pluck('name')->all();
    expect($nomesPendentes)->toContain('Professor Pendente')
        ->and($nomesPendentes)->not->toContain('Aluno Ativo');
});

test('administrador cadastra novo usuario pelo painel com turma e status confirmado', function () {
    $admin = User::factory()->create([
        'role' => UserRole::ADM,
        'status_confirmacao' => 'confirmado',
    ]);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano Informática',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
    ]);

    Sanctum::actingAs($admin);

    $payload = [
        'name' => 'Mariana Oliveira',
        'email' => 'mariana.oliveira@aluno.mg.gov.br',
        'password' => 'SenhaForte123!',
        'role' => 'aluno',
        'turma_id' => $turma->id_turma,
        'telefone' => '(31) 99999-8888',
        'data_nascimento' => '2008-03-20',
        'status_confirmacao' => 'confirmado',
    ];

    $response = $this->postJson('/api/usuarios', $payload);
    $response->assertStatus(201)
        ->assertJsonPath('name', 'Mariana Oliveira')
        ->assertJsonPath('email', 'mariana.oliveira@aluno.mg.gov.br')
        ->assertJsonPath('role', 'aluno')
        ->assertJsonPath('status_confirmacao', 'confirmado')
        ->assertJsonPath('turma', '3º Ano Informática');

    $novoUser = User::where('email', 'mariana.oliveira@aluno.mg.gov.br')->first();
    expect($novoUser)->not->toBeNull()
        ->and($novoUser->autorizado_por_id)->toBe($admin->id)
        ->and($novoUser->status_confirmacao)->toBe('confirmado')
        ->and($novoUser->matriculas()->count())->toBe(1)
        ->and($novoUser->vinculos()->count())->toBe(1);
});
