<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Configuração Global da Suíte Pest
|--------------------------------------------------------------------------
|
| Vincula o TestCase do Laravel e o RefreshDatabase (PostgreSQL de testes)
| aos testes de Feature, e o TestCase leve aos testes de Unit.
| Ativa globalmente Http::preventStrayRequests() para bloquear chamadas
| HTTP externas reais não mockadas (ex.: Google OAuth ou Gemini API).
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function () {
        // Impede chamadas de rede reais acidentais durante a execução dos testes
        Http::preventStrayRequests();
    })
    ->in('Feature');

pest()->extend(TestCase::class)
    ->beforeEach(function () {
        Http::preventStrayRequests();
    })
    ->in('Unit');

/**
 * Helper global compartilhado para instanciar e persistir um usuário com papel institucional.
 *
 * @param  array<string, mixed>  $atributos
 */
function criarUsuarioComPapel(UserRole|string $role, array $atributos = []): User
{
    $roleEnum = $role instanceof UserRole ? $role : UserRole::from($role);

    return User::factory()->create(array_merge([
        'role' => $roleEnum,
        'status_confirmacao' => 'confirmado',
        'ativo' => true,
    ], $atributos));
}
