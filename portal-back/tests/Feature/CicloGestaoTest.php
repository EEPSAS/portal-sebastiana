<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
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

test('especialista vincula e desvincula disciplina de ciclo existente', function () {
    Sanctum::actingAs(usuarioComPapel(UserRole::ESPECIALISTA));

    $ciclo = Ciclo::create(['nome' => 'Ensino Médio Regular']);
    $disciplina = Disciplina::factory()->create(['nome' => 'Filosofia']);

    // 1. Vincula
    $this->postJson("/api/ciclos/{$ciclo->id_ciclo}/disciplinas", [
        'disciplina_id' => $disciplina->id_disciplina,
    ])
        ->assertOk()
        ->assertJsonPath('data.id_ciclo', $ciclo->id_ciclo);

    expect($ciclo->fresh()->disciplinas->pluck('id_disciplina'))->toContain($disciplina->id_disciplina);

    // 2. Desvincula
    $this->deleteJson("/api/ciclos/{$ciclo->id_ciclo}/disciplinas/{$disciplina->id_disciplina}")
        ->assertOk();

    expect($ciclo->fresh()->disciplinas->pluck('id_disciplina'))->not->toContain($disciplina->id_disciplina)
        ->and(Disciplina::find($disciplina->id_disciplina))->not->toBeNull();
});

test('desvincular disciplina do ciclo ou remover ciclo da disciplina limpa vinculo em turma_disciplinas', function () {
    Sanctum::actingAs(usuarioComPapel(UserRole::ESPECIALISTA));

    $ciclo1 = Ciclo::create(['nome' => '1º Ano - Regular']);
    $ciclo2 = Ciclo::create(['nome' => '2º Ano - Regular']);

    $turma1 = Turma::create([
        'nome_identificador' => '1º Ano',
        'ciclo_id' => $ciclo1->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $disciplina = Disciplina::create([
        'nome' => 'Sociologia',
        'aulas_semanais' => 1,
        'carga_horaria_anual' => 40,
    ]);

    // 1. Vincula ao ciclo 1 -> propaga para turma 1
    $this->postJson("/api/ciclos/{$ciclo1->id_ciclo}/disciplinas", [
        'disciplina_id' => $disciplina->id_disciplina,
    ])->assertOk();

    expect(TurmaDisciplina::where('turma_id', $turma1->id_turma)
        ->where('disciplina_id', $disciplina->id_disciplina)
        ->exists())->toBeTrue();

    // 2. Desvincula do ciclo 1 via CicloController -> remove de turma_disciplinas da turma 1
    $this->deleteJson("/api/ciclos/{$ciclo1->id_ciclo}/disciplinas/{$disciplina->id_disciplina}")
        ->assertOk();

    expect(TurmaDisciplina::where('turma_id', $turma1->id_turma)
        ->where('disciplina_id', $disciplina->id_disciplina)
        ->exists())->toBeFalse();

    // 3. Vincula novamente e depois altera o ciclo da disciplina para ciclo 2 via PUT /api/disciplinas/{id}
    $this->postJson("/api/ciclos/{$ciclo1->id_ciclo}/disciplinas", [
        'disciplina_id' => $disciplina->id_disciplina,
    ])->assertOk();

    $this->putJson("/api/disciplinas/{$disciplina->id_disciplina}", [
        'nome' => 'Sociologia',
        'aulas_semanais' => 1,
        'carga_horaria_anual' => 40,
        'ciclo_ids' => [$ciclo2->id_ciclo],
    ])->assertOk();

    expect(TurmaDisciplina::where('turma_id', $turma1->id_turma)
        ->where('disciplina_id', $disciplina->id_disciplina)
        ->exists())->toBeFalse();
});
