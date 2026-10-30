<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

// Cria um usuário confirmado com o papel informado (atalho para os testes)
function usuarioComPapel(UserRole $role): User
{
    return User::factory()->create([
        'role' => $role,
        'status_confirmacao' => 'confirmado',
    ]);
}

test('especialista edita nome e comentario do ciclo', function () {
    Sanctum::actingAs(usuarioComPapel(UserRole::ESPECIALISTA));
    $ciclo = Ciclo::create(['nome' => '1º Ano']);

    $this->putJson("/api/ciclos/{$ciclo->id_ciclo}", [
        'nome' => '1º Ano - Ensino Médio',
        'descricao' => 'Turmas matutinas.',
    ])
        ->assertOk()
        ->assertJsonPath('data.id_ciclo', $ciclo->id_ciclo)
        ->assertJsonPath('data.nome', '1º Ano - Ensino Médio')
        ->assertJsonPath('data.descricao', 'Turmas matutinas.');
});

test('comentario do ciclo aceita ate 256 caracteres e rejeita 257', function () {
    Sanctum::actingAs(usuarioComPapel(UserRole::ESPECIALISTA));

    $this->postJson('/api/ciclos', ['nome' => 'Ciclo A', 'descricao' => str_repeat('a', 256)])
        ->assertCreated();

    $this->postJson('/api/ciclos', ['nome' => 'Ciclo B', 'descricao' => str_repeat('a', 257)])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('descricao');
});

test('excluir ciclo preserva disciplinas (viram nao vinculadas) e turmas', function () {
    Sanctum::actingAs(usuarioComPapel(UserRole::ESPECIALISTA));

    $ciclo = Ciclo::create(['nome' => '2º Ano']);
    $disciplina = Disciplina::factory()->create();
    $disciplina->ciclos()->sync([$ciclo->id_ciclo]);

    $idTurma = $this->postJson('/api/turmas', [
        'nome_identificador' => '2º Ano A',
        'ciclo_id' => $ciclo->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ])->assertCreated()->json('id_turma');

    $this->deleteJson("/api/ciclos/{$ciclo->id_ciclo}")->assertNoContent();

    // Ciclo some, mas a disciplina continua existindo e aparece como "sem ciclo"
    expect(Ciclo::find($ciclo->id_ciclo))->toBeNull()
        ->and(Disciplina::find($disciplina->id_disciplina))->not->toBeNull();

    $idsSemCiclo = collect($this->getJson('/api/ciclos')->json('disciplinas_sem_ciclo'))->pluck('id_disciplina');
    expect($idsSemCiclo)->toContain($disciplina->id_disciplina);

    // A turma permanece, apenas sem ciclo
    $this->assertDatabaseHas('turmas', ['id_turma' => $idTurma, 'ciclo_id' => null]);
});

test('professor nao pode editar nem excluir ciclos', function () {
    $ciclo = Ciclo::create(['nome' => '3º Ano']);
    Sanctum::actingAs(usuarioComPapel(UserRole::PROFESSOR));

    $this->putJson("/api/ciclos/{$ciclo->id_ciclo}", ['nome' => 'Outro'])->assertForbidden();
    $this->deleteJson("/api/ciclos/{$ciclo->id_ciclo}")->assertForbidden();
});
