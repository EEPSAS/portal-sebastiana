<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('registers a user and returns a sanctum token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Ana',
        'email' => 'ana@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'ana@example.com')
        ->assertJsonPath('token_type', 'Bearer')
        ->assertJsonStructure(['user', 'token', 'token_type']);

    expect(User::where('email', 'ana@example.com')->exists())->toBeTrue();
});

test('logs in with valid credentials and rejects invalid credentials', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertUnauthorized();

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk()->assertJsonStructure(['user', 'token', 'token_type']);
});

test('requires a sanctum token for protected resources and can revoke it', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $this->getJson('/api/user')
        ->assertUnauthorized();

    $this->withToken($token)->getJson('/api/user')
        ->assertOk();

    $this->withToken($token)->postJson('/api/auth/logout')
        ->assertOk();

    expect($user->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();

    $this->withToken($token)->getJson('/api/user')
        ->assertUnauthorized();
});

test('has a defined named route login that returns 401 json on GET', function () {
    expect(route('login'))->toContain('/api/login');

    $response = $this->get(route('login'));

    $response->assertUnauthorized()
        ->assertJsonStructure(['message']);
});

test('unauthenticated non-json requests to protected api routes return 401 json without error', function () {
    $response = $this->get('/api/user');

    $response->assertUnauthorized();
});

test('allows logging in via direct /api/login endpoint as well as /api/auth/login', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);

    $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk()->assertJsonStructure(['user', 'token', 'token_type']);
});

test('cadastro publico ignora tentativa de escalacao de papel e atribui sempre aluno', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Tentativa Admin',
        'email' => 'tentativa.admin@aluno.mg.gov.br',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'adm',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.role', 'aluno');
});

test('cadastro publico rejeita email duplicado ou senha curta com 422', function () {
    User::factory()->create(['email' => 'duplicado@aluno.mg.gov.br']);

    $this->postJson('/api/auth/register', [
        'name' => 'Outro',
        'email' => 'duplicado@aluno.mg.gov.br',
        'password' => '123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'password']);
});

test('login de usuario bloqueado pelo administrador retorna 403 forbidden', function () {
    $user = User::factory()->create([
        'email' => 'bloqueado@aluno.mg.gov.br',
        'password' => Hash::make('password123'),
        'ativo' => false,
    ]);

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password123',
    ])->assertForbidden()
        ->assertJsonPath('message', 'Usuário bloqueado pelo administrador. Acesso negado.');
});

test('administrador pode logar informando apenas o usuario sem dominio de email institucional', function () {
    $admin = User::factory()->create([
        'name' => 'Administrador Geral',
        'email' => 'admin',
        'role' => 'adm',
        'password' => Hash::make('password123'),
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'admin',
        'password' => 'password123',
    ])->assertOk()
        ->assertJsonPath('user.id', $admin->id)
        ->assertJsonStructure(['user', 'token', 'token_type']);
});
