<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('administrador acessa o dashboard admin com a estrutura esperada', function () {
    $adm = User::where('role', UserRole::ADM)->first() ?? User::factory()->create(['role' => UserRole::ADM]);

    $this->actingAs($adm, 'sanctum')
        ->getJson('/api/dashboard/admin')
        ->assertOk()
        ->assertJsonStructure([
            'usuarios' => ['total', 'por_perfil' => ['aluno', 'professor', 'especialista', 'bibliotecaria', 'adm'], 'ativos', 'inativos', 'pendentes'],
            'pendencias' => ['alunos_pendentes', 'professores_pendentes'],
            'sessoes_ativas',
            'cadastros_recentes',
            'saude_sistema' => ['*' => ['id', 'titulo', 'status', 'detalhe', 'destino']],
        ]);
});

test('perfis nao administrativos nao acessam o dashboard admin', function () {
    foreach (['carlos.silva@sebastiana.edu.br', 'clara.mendes@sebastiana.edu.br'] as $email) {
        $usuario = User::where('email', $email)->first();

        $this->actingAs($usuario, 'sanctum')->getJson('/api/dashboard/admin')->assertForbidden();
    }
});
