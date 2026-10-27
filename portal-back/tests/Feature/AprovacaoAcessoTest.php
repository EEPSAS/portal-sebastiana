<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

test('cadastro de professor institucional cria pedido pendente sem token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Professora Exemplo',
        'email' => 'professora@educacao.mg.gov.br',
        'password' => 'senha-segura',
    ]);

    $response->assertAccepted()
        ->assertJsonPath('user.role', 'professor')
        ->assertJsonPath('approval_status', 'pending')
        ->assertJsonPath('token', null);
});

test('cadastro recusa enderecos fora dos dominios escolares', function () {
    $this->postJson('/api/auth/register', [
        'name' => 'Usuário externo',
        'email' => 'externo@gmail.com',
        'password' => 'senha-segura',
    ])->assertUnprocessable();
});

test('pedido rejeitado pode ser reenviado pelo login sem receber token', function () {
    $aluno = User::factory()->create([
        'email' => 'aluno.reprovado@aluno.mg.gov.br',
        'password' => Hash::make('senha-segura'),
        'role' => UserRole::ALUNO,
        'approval_status' => 'rejected',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => $aluno->email,
        'password' => 'senha-segura',
    ])->assertForbidden()
        ->assertJsonPath('approval_status', 'pending')
        ->assertJsonPath('token', null);

    expect($aluno->fresh()->approval_status)->toBe('pending');
});

test('token anterior de aluno pendente nao acessa nenhuma rota protegida', function () {
    $aluno = User::factory()->create([
        'email' => 'aluno.aguardando@aluno.mg.gov.br',
        'approval_status' => 'pending',
    ]);
    $token = $aluno->createToken('sessao-antiga')->plainTextToken;

    $this->withToken($token)->getJson('/api/user')
        ->assertForbidden()
        ->assertJsonPath('approval_status', 'pending');
});

test('somente o especialista pode aprovar alunos e professores', function () {
    $especialista = User::factory()->especialista()->create();
    $professor = User::factory()->create([
        'email' => 'professor.pendente@educacao.mg.gov.br',
        'password' => Hash::make('senha-professor'),
        'role' => UserRole::PROFESSOR,
        'approval_status' => 'pending',
    ]);
    $aluno = User::factory()->create([
        'email' => 'aluno.pendente@aluno.mg.gov.br',
        'password' => Hash::make('senha-segura'),
        'approval_status' => 'pending',
    ]);

    $this->actingAs($professor, 'sanctum')->getJson('/api/aprovacoes/usuarios')
        ->assertForbidden();

    $this->actingAs($especialista, 'sanctum')->getJson('/api/aprovacoes/usuarios')
        ->assertOk()
        ->assertJsonFragment(['email' => $professor->email])
        ->assertJsonFragment(['email' => $aluno->email]);

    $this->actingAs($especialista, 'sanctum')->patchJson("/api/aprovacoes/usuarios/{$aluno->id}", [
        'approval_status' => 'approved',
    ])->assertOk()
        ->assertJsonPath('approval_status', 'approved');

    $this->actingAs($especialista, 'sanctum')->patchJson("/api/aprovacoes/usuarios/{$professor->id}", [
        'approval_status' => 'approved',
    ])->assertOk()
        ->assertJsonPath('approval_status', 'approved');

    $this->postJson('/api/auth/login', [
        'email' => $aluno->email,
        'password' => 'senha-segura',
    ])->assertOk()
        ->assertJsonStructure(['user', 'token', 'token_type']);

    $this->postJson('/api/auth/login', [
        'email' => $professor->email,
        'password' => 'senha-professor',
    ])->assertOk()
        ->assertJsonPath('user.role', 'professor');
});

test('administrador nao pode decidir pedidos de acesso', function () {
    $admin = User::factory()->adm()->create();

    $this->actingAs($admin, 'sanctum')->getJson('/api/aprovacoes/usuarios')
        ->assertForbidden();
});

test('especialista nao aprova contas escolares com dominio incompatível', function () {
    $especialista = User::factory()->especialista()->create();
    $alunoLegado = User::factory()->create([
        'email' => 'aluno@sebastiana.edu.br',
        'approval_status' => 'pending',
    ]);

    $this->actingAs($especialista, 'sanctum')->patchJson("/api/aprovacoes/usuarios/{$alunoLegado->id}", [
        'approval_status' => 'approved',
    ])->assertUnprocessable();

    expect($alunoLegado->fresh()->approval_status)->toBe('pending');
});

test('usuarios criados ou promovidos a aluno pelo administrador também ficam pendentes', function () {
    $this->seed(RolePermissionSeeder::class);
    $admin = User::factory()->adm()->create();

    $response = $this->actingAs($admin, 'sanctum')->postJson('/api/usuarios', [
        'name' => 'Novo aluno',
        'email' => 'novo.aluno@aluno.mg.gov.br',
        'password' => 'senha-segura',
        'role' => 'aluno',
    ]);

    $response->assertCreated()
        ->assertJsonPath('approval_status', 'pending');

    $aluno = User::factory()->create([
        'email' => 'promovido@aluno.mg.gov.br',
        'role' => UserRole::ESPECIALISTA,
    ]);
    $aluno->createToken('sessao-antiga');

    $this->actingAs($admin, 'sanctum')->patchJson("/api/usuarios/{$aluno->id}/papel", [
        'role' => 'aluno',
    ])->assertOk()
        ->assertJsonPath('usuario.approval_status', 'pending');

    expect($aluno->fresh()->tokens()->count())->toBe(0);
});
