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

test('especialista atualiza parametros de turno mesmo com identificador em minusculas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $response = $this->actingAs($especialista, 'sanctum')->putJson('/api/turnos/matutino', [
        'hora_inicio' => '07:00',
        'hora_fim' => '12:15',
        'duracao_aula_minutos' => 50,
        'intervalo_inicio' => '09:30',
        'intervalo_fim' => '09:45',
        'quantidade_aulas' => 5,
    ]);

    $response->assertOk()
        ->assertJsonPath('id', 'Matutino')
        ->assertJsonPath('intervalo_fim', '09:45');

    expect(Turno::find('Matutino')->intervalo_fim)->toBe('09:45');
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

test('binding de turno auto-recupera turno canonico quando nao existe no banco', function () {
    Turno::where('id', 'Matutino')->delete();
    expect(Turno::where('id', 'Matutino')->exists())->toBeFalse();

    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $response = $this->actingAs($especialista, 'sanctum')->putJson('/api/turnos/Matutino', [
        'hora_inicio' => '07:00',
        'hora_fim' => '12:15',
        'duracao_aula_minutos' => 50,
        'quantidade_aulas' => 5,
        'pausas' => [
            [
                'tipo' => 'intervalo',
                'rotulo' => 'Intervalo / Recreio',
                'hora_inicio' => '09:30',
                'hora_fim' => '09:45',
            ],
        ],
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('id', 'Matutino');

    expect(Turno::where('id', 'Matutino')->exists())->toBeTrue();
});

test('listar turnos auto-popula a base se a tabela estiver completamente vazia', function () {
    Turno::query()->delete();
    expect(Turno::count())->toBe(0);

    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $response = $this->actingAs($especialista, 'sanctum')->getJson('/api/turnos');

    $response->assertOk();
    expect(count($response->json()))->toBe(4)
        ->and(Turno::count())->toBe(4);
});

test('especialista atualiza turno integral com pausas de recreio e almoco', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $response = $this->actingAs($especialista, 'sanctum')->putJson('/api/turnos/Integral', [
        'hora_inicio' => '07:00',
        'hora_fim' => '16:25',
        'duracao_aula_minutos' => 50,
        'quantidade_aulas' => 9,
        'pausas' => [
            [
                'tipo' => 'intervalo',
                'rotulo' => 'Intervalo Manhã',
                'hora_inicio' => '09:30',
                'hora_fim' => '09:45',
            ],
            [
                'tipo' => 'almoco',
                'rotulo' => 'Almoço',
                'hora_inicio' => '11:25',
                'hora_fim' => '12:50',
            ],
            [
                'tipo' => 'intervalo',
                'rotulo' => 'Intervalo Tarde',
                'hora_inicio' => '14:30',
                'hora_fim' => '14:45',
            ],
        ],
    ]);

    $response->assertOk()
        ->assertJsonCount(3, 'pausas')
        ->assertJsonPath('pausas.1.tipo', 'almoco');

    $turnoIntegral = Turno::find('Integral');
    expect($turnoIntegral->pausas)->toHaveCount(3);
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

    // Aulas geradas para turma Matutino devem estar estritamente dentro dos 5 períodos diários cadastrados
    $aulas = Horario::where('turma_id', $turma->id_turma)->first()->aulas;
    expect($aulas->max('aula_numero'))->toBeLessThanOrEqual(5);
});

test('professor pode lecionar no matutino e no vespertino no mesmo dia sem falso choque', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $profCompartilhado = User::factory()->create(['role' => UserRole::PROFESSOR]);

    $ciclo = Ciclo::create(['nome' => 'Ciclo Teste Compartilhado']);
    $discMat = Disciplina::create([
        'nome' => 'História Matutina',
        'aulas_semanais' => 2,
        'carga_horaria_anual' => 80,
    ]);
    $discVesp = Disciplina::create([
        'nome' => 'História Vespertina',
        'aulas_semanais' => 2,
        'carga_horaria_anual' => 80,
    ]);
    $ciclo->disciplinas()->attach([$discMat->id_disciplina, $discVesp->id_disciplina]);
    $discMat->professores()->attach($profCompartilhado->id);
    $discVesp->professores()->attach($profCompartilhado->id);

    // Turma 1 - Matutino
    $turmaMat = Turma::create([
        'nome_identificador' => 'Turma 101 - Matutino',
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 30,
        'status' => 'Ativa',
        'ciclo_id' => $ciclo->id_ciclo,
    ]);
    TurmaDisciplina::create([
        'turma_id' => $turmaMat->id_turma,
        'disciplina_id' => $discMat->id_disciplina,
        'professor_id' => $profCompartilhado->id,
    ]);

    // Turma 2 - Vespertino
    $turmaVesp = Turma::create([
        'nome_identificador' => 'Turma 201 - Vespertino',
        'turno' => 'Vespertino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 30,
        'status' => 'Ativa',
        'ciclo_id' => $ciclo->id_ciclo,
    ]);
    TurmaDisciplina::create([
        'turma_id' => $turmaVesp->id_turma,
        'disciplina_id' => $discVesp->id_disciplina,
        'professor_id' => $profCompartilhado->id,
    ]);

    // Gera turma do Matutino primeiro
    $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turmaMat->id_turma}/horario/gerar")
        ->assertCreated();

    // Em seguida, gera turma do Vespertino: não deve haver bloqueio de horário por serem turnos disjuntos
    $responseVesp = $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turmaVesp->id_turma}/horario/gerar");

    $responseVesp->assertCreated()
        ->assertJsonPath('status', 'concluido');

    expect(Horario::where('turma_id', $turmaVesp->id_turma)->exists())->toBeTrue();
});

test('turma em turno integral com 44 aulas semanais do ciclo gera grade sem erro de limite', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $ciclo = Ciclo::create(['nome' => '3º Ano - EMTI']);
    $professores = User::factory()->count(11)->create(['role' => UserRole::PROFESSOR]);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano - ADS',
        'turno' => 'Integral',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 35,
        'status' => 'Ativa',
        'ciclo_id' => $ciclo->id_ciclo,
    ]);

    // 11 disciplinas de 4 aulas semanais cada = 44 aulas semanais
    for ($i = 1; $i <= 11; $i++) {
        $disc = Disciplina::create([
            'nome' => "Disciplina EMTI {$i}",
            'aulas_semanais' => 4,
            'carga_horaria_anual' => 160,
        ]);
        $ciclo->disciplinas()->attach($disc->id_disciplina);
        TurmaDisciplina::create([
            'turma_id' => $turma->id_turma,
            'disciplina_id' => $disc->id_disciplina,
            'professor_id' => $professores[$i - 1]->id,
        ]);
    }

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/horario/gerar");

    $response->assertCreated()
        ->assertJsonPath('status', 'concluido');

    $aulas = Horario::where('turma_id', $turma->id_turma)->first()->aulas;
    expect($aulas->count())->toBe(44)
        ->and($aulas->max('aula_numero'))->toBeLessThanOrEqual(9);
});

test('rejeita geracao de grade quando ciclo excede capacidade máxima do turno', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    $ciclo = Ciclo::create(['nome' => 'Ciclo Carga Excessiva']);
    $prof = User::factory()->create(['role' => UserRole::PROFESSOR]);

    $turma = Turma::create([
        'nome_identificador' => 'Turma Excesso',
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 35,
        'status' => 'Ativa',
        'ciclo_id' => $ciclo->id_ciclo,
    ]);

    // 6 disciplinas de 5 aulas semanais = 30 aulas (excede os 25 do Matutino: 5 * 5 = 25)
    for ($i = 1; $i <= 6; $i++) {
        $disc = Disciplina::create([
            'nome' => "Disciplina Excesso {$i}",
            'aulas_semanais' => 5,
            'carga_horaria_anual' => 200,
        ]);
        $ciclo->disciplinas()->attach($disc->id_disciplina);
        TurmaDisciplina::create([
            'turma_id' => $turma->id_turma,
            'disciplina_id' => $disc->id_disciplina,
            'professor_id' => $prof->id,
        ]);
    }

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/horario/gerar");

    $response->assertStatus(422)
        ->assertJsonValidationErrors('curriculo');
});
