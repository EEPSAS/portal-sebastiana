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

test('rejeita token do Google quando o aud (Client ID) diverge do configurado na aplicacao', function () {
    config(['services.google.client_id' => 'client-id-oficial.apps.googleusercontent.com']);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-user-aud-999',
            'aud' => 'outro-client-id-invalido.apps.googleusercontent.com',
            'email' => 'ada.lovelace@aluno.mg.gov.br',
            'name' => 'Ada Lovelace',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'jwt-de-outro-app',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Token do Google emitido para outro aplicativo (Client ID divergente).');
});

test('preserva matricula Ativo do aluno ao autenticar novamente com Google informando turma_id', function () {
    $turma = Turma::create([
        'nome_identificador' => '2º Ano B - Ensino Médio',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
    ]);

    $aluno = User::factory()->create([
        'email' => 'grace.hopper@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    Matricula::create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'data_matricula' => now()->toDateString(),
        'status_matricula' => 'Ativo',
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-grace-123',
            'email' => 'grace.hopper@aluno.mg.gov.br',
            'name' => 'Grace Hopper',
        ], 200),
    ]);

    $response = $this->postJson('/api/auth/google', [
        'credential' => 'valid-jwt-token',
        'turma_id' => $turma->id_turma,
    ]);

    $response->assertOk();

    $matricula = Matricula::where('usuario_id', $aluno->id)
        ->where('turma_id', $turma->id_turma)
        ->first();

    expect($matricula->status_matricula)->toBe('Ativo');
});

test('preserva a foto de perfil enviada pelo usuario ao autenticar novamente com Google', function () {
    $aluno = User::factory()->create([
        'email' => 'foto.propria@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'avatar' => 'avatars/foto-propria.jpg',
        'ativo' => true,
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-foto-propria',
            'email' => 'foto.propria@aluno.mg.gov.br',
            'name' => 'Foto Propria',
            'picture' => 'https://example.com/foto-google.jpg',
        ], 200),
    ]);

    $this->postJson('/api/auth/google', ['credential' => 'valid-jwt-token'])->assertOk();

    // A foto enviada pelo usuário não pode ser trocada pela foto do Google
    expect($aluno->fresh()->avatar)->toBe('avatars/foto-propria.jpg');
});

test('usa a foto do Google quando o usuario existente ainda nao tem avatar', function () {
    $aluno = User::factory()->create([
        'email' => 'sem.foto@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'avatar' => null,
        'ativo' => true,
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-sem-foto',
            'email' => 'sem.foto@aluno.mg.gov.br',
            'name' => 'Sem Foto',
            'picture' => 'https://example.com/foto-google.jpg',
        ], 200),
    ]);

    $this->postJson('/api/auth/google', ['credential' => 'valid-jwt-token'])->assertOk();

    expect($aluno->fresh()->avatar)->toBe('https://example.com/foto-google.jpg');
});
