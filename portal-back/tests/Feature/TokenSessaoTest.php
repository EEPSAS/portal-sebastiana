<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

uses(RefreshDatabase::class);

test('login e auto-cadastro registram origem, ip, user_agent e validade maxima de 6 horas no token', function () {
    $usuario = User::factory()->create([
        'email' => 'professor.teste@sebastiana.edu.br',
        'password' => Hash::make('senha12345'),
        'role' => UserRole::PROFESSOR,
        'ativo' => true,
    ]);

    $response = $this->withHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
    ])->postJson('/api/auth/login', [
        'email' => 'professor.teste@sebastiana.edu.br',
        'password' => 'senha12345',
    ]);

    $response->assertOk()->assertJsonStructure(['user', 'token', 'token_type']);

    $tokenModel = PersonalAccessToken::query()->latest('id')->first();
    expect($tokenModel)->not->toBeNull()
        ->and($tokenModel->getAttribute('origem'))->toBe('login_senha')
        ->and($tokenModel->getAttribute('user_agent'))->toContain('Chrome/130.0.0.0')
        ->and($tokenModel->expires_at)->not->toBeNull();

    // Verifica que a validade foi definida para aproximadamente 6 horas (entre 355 e 361 minutos)
    $minutosRestantes = now()->diffInMinutes($tokenModel->expires_at, false);
    expect($minutosRestantes)->toBeGreaterThanOrEqual(355)
        ->toBeLessThanOrEqual(361);
});

test('logout revoga e remove fisicamente o token sanctum da sessao atual', function () {
    $usuario = User::factory()->create([
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    $plainToken = $usuario->createToken('portal-front', ['*'], now()->addHours(6))->plainTextToken;
    expect(PersonalAccessToken::query()->count())->toBe(1);

    $this->withHeader('Authorization', 'Bearer '.$plainToken)
        ->postJson('/api/auth/logout')
        ->assertOk();

    expect(PersonalAccessToken::query()->count())->toBe(0);
});

test('listagem administrativa de tokens exibe origem e datas mas oculta o valor secreto do token', function () {
    $adm = User::factory()->create(['role' => UserRole::ADM, 'ativo' => true]);
    $aluno = User::factory()->create([
        'name' => 'Estudante Exemplo',
        'email' => 'estudante@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'ativo' => true,
    ]);

    $novoToken = $aluno->createToken('portal-front', ['*'], now()->addHours(6));
    $novoToken->accessToken->forceFill([
        'origem' => 'login_google',
        'ip_address' => '192.168.1.42',
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0',
    ])->save();

    $response = $this->actingAs($adm, 'sanctum')
        ->getJson('/api/tokens?origem=login_google');

    $response->assertOk()
        ->assertJsonPath('resumo.ativos', 1)
        ->assertJsonPath('data.0.origem', 'login_google')
        ->assertJsonPath('data.0.origem_label', 'Login Institucional Google')
        ->assertJsonPath('data.0.ip_address', '192.168.1.42')
        ->assertJsonPath('data.0.dispositivo_resumo', 'Chrome • Windows')
        ->assertJsonPath('data.0.usuario.email', 'estudante@aluno.mg.gov.br');

    // Garante que o hash/valor secreto do token não está presente no JSON retornado
    $item = $response->json('data.0');
    expect($item)->not->toHaveKey('token')
        ->and($item)->not->toHaveKey('plainTextToken');
});

test('usuarios sem permissao administrativa nao podem listar ou deletar tokens', function () {
    $aluno = User::factory()->create(['role' => UserRole::ALUNO, 'ativo' => true]);
    $token = $aluno->createToken('portal-front', ['*'], now()->addHours(6))->accessToken;

    $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/tokens')
        ->assertForbidden();

    $this->actingAs($aluno, 'sanctum')
        ->deleteJson("/api/tokens/{$token->id}")
        ->assertForbidden();
});

test('administrador pode deletar manualmente um token individual e limpar tokens expirados', function () {
    $adm = User::factory()->create(['role' => UserRole::ADM, 'ativo' => true]);
    $aluno = User::factory()->create(['role' => UserRole::ALUNO, 'ativo' => true]);

    // Cria 1 token ativo e 1 token já vencido (> 6h)
    $tokenAtivo = $aluno->createToken('portal-front', ['*'], now()->addHours(6))->accessToken;
    $tokenVencido = $aluno->createToken('portal-front', ['*'], now()->subMinutes(10))->accessToken;
    $tokenVencido->forceFill([
        'created_at' => now()->subHours(7),
    ])->save();

    // O KPI de sessões ativas deve contar apenas o token não expirado
    $this->actingAs($adm, 'sanctum')
        ->getJson('/api/dashboard/admin')
        ->assertOk()
        ->assertJsonPath('sessoes_ativas', 1);

    // O comando agendado (e o endpoint de limpeza) deve apagar apenas o token vencido
    $this->artisan('app:limpar-tokens-expirados')
        ->assertSuccessful();

    expect(PersonalAccessToken::query()->whereKey($tokenVencido->id)->exists())->toBeFalse()
        ->and(PersonalAccessToken::query()->whereKey($tokenAtivo->id)->exists())->toBeTrue();

    // O administrador deleta manualmente o token ativo restante
    $this->actingAs($adm, 'sanctum')
        ->deleteJson("/api/tokens/{$tokenAtivo->id}")
        ->assertOk();

    expect(PersonalAccessToken::query()->whereKey($tokenAtivo->id)->exists())->toBeFalse();
});
