<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('registers a student as pending without issuing a sanctum token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Ana',
        'email' => 'ana@aluno.mg.gov.br',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertAccepted()
        ->assertJsonPath('user.email', 'ana@aluno.mg.gov.br')
        ->assertJsonPath('approval_status', 'pending')
        ->assertJsonPath('token', null);

    expect(User::where('email', 'ana@aluno.mg.gov.br')->value('approval_status'))->toBe('pending');
});

test('logs in with valid credentials and rejects invalid credentials', function () {
    $user = User::factory()->create([
        'email' => 'aluno.login@aluno.mg.gov.br',
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
        'email' => 'aluno.direto@aluno.mg.gov.br',
        'password' => Hash::make('password'),
    ]);

    $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk()->assertJsonStructure(['user', 'token', 'token_type']);
});
