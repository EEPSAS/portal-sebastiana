<?php

use App\Enums\UserRole;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

test('permite autenticação de aluno com email institucional @aluno.mg.gov.br e emite token Sanctum', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-123',
            'email' => 'ada.lovelace@aluno.mg.gov.br',
            'name' => 'Ada Lovelace',
            'picture' => 'https://example.com/ada.jpg',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.email', 'ada.lovelace@aluno.mg.gov.br')
        ->assertJsonPath('user.role', 'aluno')
        ->assertJsonPath('user.avatar', 'https://example.com/ada.jpg')
        ->assertJsonPath('user.google_vinculado', true)
        ->assertJsonStructure(['user', 'token', 'token_type']);

    $user = User::where('email', 'ada.lovelace@aluno.mg.gov.br')->first();
    expect($user)->not->toBeNull()
        ->and($user->google_id)->toBe('google-user-123')
        ->and($user->role)->toBe(UserRole::ALUNO);
});

test('cria vinculo de turma em stand by com status Pendente para o aluno', function () {
    $turma = Turma::create([
        'nome_identificador' => '3º Ano A - Informática',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-456',
            'email' => 'turing@aluno.mg.gov.br',
            'name' => 'Alan Turing',
            'picture' => 'https://example.com/alan.jpg',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
        'turma_id' => $turma->id_turma,
    ]);

    $response->assertOk();

    $user = User::where('email', 'turing@aluno.mg.gov.br')->first();
    expect($user)->not->toBeNull();

    $matricula = Matricula::where('usuario_id', $user->id)
        ->where('turma_id', $turma->id_turma)
        ->first();

    expect($matricula)->not->toBeNull()
        ->and($matricula->status_matricula)->toBe('Pendente');
});

test('permite login de professor com @educacao.mg.gov.br e atribui perfil professor', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-prof-789',
            'email' => 'margaret.hamilton@educacao.mg.gov.br',
            'name' => 'Margaret Hamilton',
            'picture' => 'https://example.com/margaret.jpg',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.email', 'margaret.hamilton@educacao.mg.gov.br')
        ->assertJsonPath('user.role', 'professor');
});

test('normaliza automaticamente email institucional com acento @educação.mg.gov.br', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-acento-101',
            'email' => 'professor@educação.mg.gov.br',
            'name' => 'Professor Acentuado',
            'picture' => 'https://example.com/prof.jpg',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.email', 'professor@educacao.mg.gov.br');
});

test('bloqueia e retorna 403 para dominios publicos como @gmail.com com mensagem oficial de seguranca', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-gmail-999',
            'email' => 'usuario.externo@gmail.com',
            'name' => 'Usuário Externo',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
    ]);

    $response->assertStatus(403)
        ->assertJsonPath('message', 'Acesso restrito. Utilize exclusivamente seu e-mail institucional (@aluno.mg.gov.br ou @educacao.mg.gov.br)');
});

test('retorna 401 quando o token do Google for invalido ou expirado', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'error_description' => 'Invalid Value',
        ], 400),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'token-invalido',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Token do Google inválido ou expirado.');
});

test('bloqueia login de usuario desativado pelo administrador', function () {
    $user = User::factory()->create([
        'email' => 'aluno.bloqueado@aluno.mg.gov.br',
        'ativo' => false,
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-bloqueado',
            'email' => 'aluno.bloqueado@aluno.mg.gov.br',
            'name' => 'Aluno Bloqueado',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
    ]);

    $response->assertStatus(403)
        ->assertJsonPath('message', 'Usuário bloqueado pelo administrador. Acesso negado.');
});

test('mantem login tradicional por email e senha funcionando normalmente (fallback)', function () {
    $user = User::factory()->create([
        'password' => Hash::make('senha-secreta-123'),
        'ativo' => true,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'senha-secreta-123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['user', 'token', 'token_type']);
});

