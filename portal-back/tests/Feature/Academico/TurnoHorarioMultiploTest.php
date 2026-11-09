<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Horario;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\Turno;
use App\Models\User;
use Database\Seeders\TurnoSeeder;

beforeEach(function () {
    $this->seed(TurnoSeeder::class);
});

test('especialista e adm podem listar turnos com grades calculadas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $response = $this->actingAs($especialista, 'sanctum')->getJson('/api/turnos');

    $response->assertOk()
        ->assertJsonStructure([
            '*' => [
                'id',
                'nome',
                'hora_inicio',
                'hora_fim',
                'duracao_aula_minutos',
                'quantidade_aulas',
                'ativo',
                'grade_horarios',
            ],
        ]);
});

test('especialista atualiza horarios e duracao de modulos do turno', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turno = Turno::where('id', 'Matutino')->first() ?? Turno::create([
        'id' => 'Matutino',
        'nome' => 'Matutino',
        'hora_inicio' => '07:00',
        'hora_fim' => '11:30',
        'duracao_aula_minutos' => 50,
        'quantidade_aulas' => 5,
        'ativo' => true,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')->putJson("/api/turnos/{$turno->id}", [
        'hora_inicio' => '07:00',
        'hora_fim' => '12:15',
        'duracao_aula_minutos' => 50,
        'intervalo_inicio' => '09:30',
        'intervalo_fim' => '09:56',
        'quantidade_aulas' => 5,
        'ativo' => true,
        'descricao' => 'Turno matutino oficial atualizado',
    ]);

    $response->assertOk()
        ->assertJsonPath('hora_fim', '12:15')
        ->assertJsonPath('intervalo_fim', '09:56');

    expect($turno->fresh()->hora_fim)->toBe('12:15')
        ->and($turno->fresh()->intervalo_fim)->toBe('09:56');
});

test('especialista alterna status ativo de um turno', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turno = Turno::first();

    $statusAnterior = $turno->ativo;

    $response = $this->actingAs($especialista, 'sanctum')->patchJson("/api/turnos/{$turno->id}/toggle");

    $response->assertOk()
        ->assertJsonPath('status', 'sucesso');

    expect($turno->fresh()->ativo)->toBe(! $statusAnterior);
});

test('usuario aluno nao pode atualizar turnos', function () {
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);
    $turno = Turno::first();

    $this->actingAs($aluno, 'sanctum')->putJson("/api/turnos/{$turno->id}", [
        'hora_inicio' => '08:00',
        'hora_fim' => '12:00',
        'duracao_aula_minutos' => 50,
        'quantidade_aulas' => 4,
    ])->assertForbidden();
});

test('especialista pode gerar horarios simultaneamente para turmas do turno', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $ciclo = Ciclo::create(['nome' => 'Ciclo Teste Turno']);
    $disc1 = Disciplina::create([
        'nome' => 'Matemática',
        'aulas_semanais' => 2,
        'carga_horaria_anual' => 80,
    ]);
    $disc2 = Disciplina::create([
        'nome' => 'Física',
        'aulas_semanais' => 2,
        'carga_horaria_anual' => 80,
    ]);
    $ciclo->disciplinas()->attach([$disc1->id_disciplina, $disc2->id_disciplina]);

    $prof = User::factory()->create(['role' => UserRole::PROFESSOR]);

    $turma = Turma::create([
        'nome_identificador' => 'Turma Turno Matutino',
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 30,
        'status' => 'Ativa',
        'ciclo_id' => $ciclo->id_ciclo,
    ]);

    TurmaDisciplina::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc1->id_disciplina,
        'professor_id' => $prof->id,
    ]);
    TurmaDisciplina::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc2->id_disciplina,
        'professor_id' => $prof->id,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')->postJson('/api/horarios/gerar-turno', [
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
    ]);

    $response->assertCreated()
        ->assertJsonPath('status', 'sucesso');

    expect(Horario::where('turma_id', $turma->id_turma)->exists())->toBeTrue();
});
