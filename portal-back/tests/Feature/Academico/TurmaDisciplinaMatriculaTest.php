<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;

test('especialista e admin podem criar, listar, atualizar e deletar turmas', function () {
    $admin = User::factory()->create(['role' => UserRole::ADM]);
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    // Criar turma como admin
    $response = $this->actingAs($admin, 'sanctum')->postJson('/api/turmas', [
        'nome_identificador' => '3º Ano A - Informática',
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 35,
        'status' => 'Ativa',
    ]);

    $response->assertCreated()
        ->assertJsonPath('nome_identificador', '3º Ano A - Informática');

    $turmaId = $response->json('id_turma');

    // Listar turmas
    $this->actingAs($especialista, 'sanctum')->getJson('/api/turmas')
        ->assertOk()
        ->assertJsonFragment(['id_turma' => $turmaId]);

    // Atualizar turma como especialista
    $this->actingAs($especialista, 'sanctum')->putJson("/api/turmas/{$turmaId}", [
        'nome_identificador' => '3º Ano A - TI Integrado',
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 40,
        'status' => 'Ativa',
    ])->assertOk()
        ->assertJsonPath('nome_identificador', '3º Ano A - TI Integrado');

    // Deletar turma como admin
    $this->actingAs($admin, 'sanctum')->deleteJson("/api/turmas/{$turmaId}")
        ->assertNoContent();

    expect(Turma::find($turmaId))->toBeNull();
});

test('usuario padrao nao pode criar ou editar turmas', function () {
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    $this->actingAs($aluno, 'sanctum')->postJson('/api/turmas', [
        'nome_identificador' => '1º Ano B',
        'turno' => 'Vespertino',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 30,
        'status' => 'Ativa',
    ])->assertForbidden();
});

test('especialista e admin podem gerenciar disciplinas e vincular professor', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $professor = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    // Criar disciplina
    $response = $this->actingAs($especialista, 'sanctum')->postJson('/api/disciplinas', [
        'nome' => 'Banco de Dados',
        'carga_horaria_anual' => 80,
        'descricao' => 'Fundamentos de SQL e modelagem relacional',
    ]);

    $response->assertCreated()
        ->assertJsonPath('nome', 'Banco de Dados');

    $disciplinaId = $response->json('id_disciplina');

    // Vincular professor à disciplina e turma
    $this->actingAs($especialista, 'sanctum')->postJson("/api/disciplinas/{$disciplinaId}/vincular-professor", [
        'professor_id' => $professor->id,
        'turma_id' => $turma->id_turma,
    ])->assertOk()
        ->assertJsonPath('professor_id', $professor->id);

    expect(TurmaDisciplina::where('turma_id', $turma->id_turma)
        ->where('disciplina_id', $disciplinaId)
        ->where('professor_id', $professor->id)
        ->exists())->toBeTrue();

    // Listar disciplinas da turma
    $this->actingAs($especialista, 'sanctum')->getJson("/api/turmas/{$turma->id_turma}/disciplinas")
        ->assertOk()
        ->assertJsonFragment(['id_disciplina' => $disciplinaId]);

    // Desvincular disciplina da turma
    $this->actingAs($especialista, 'sanctum')->deleteJson("/api/turmas/{$turma->id_turma}/disciplinas/{$disciplinaId}")
        ->assertNoContent();

    expect(TurmaDisciplina::where('turma_id', $turma->id_turma)
        ->where('disciplina_id', $disciplinaId)
        ->exists())->toBeFalse();
});

test('matricula de aluno respeita capacidade maxima e permite transferir e cancelar', function () {
    $admin = User::factory()->create(['role' => UserRole::ADM]);
    $aluno1 = User::factory()->create(['role' => UserRole::PADRAO]);
    $aluno2 = User::factory()->create(['role' => UserRole::PADRAO]);

    $turmaA = Turma::factory()->create(['capacidade_maxima' => 1, 'status' => 'Ativa']);
    $turmaB = Turma::factory()->create(['capacidade_maxima' => 30, 'status' => 'Ativa']);

    // Matricular aluno 1 na turma A
    $resp1 = $this->actingAs($admin, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turmaA->id_turma,
        'usuario_id' => $aluno1->id,
    ]);

    $resp1->assertCreated()
        ->assertJsonPath('status_matricula', 'Ativo');

    $matriculaId = $resp1->json('id_matricula');

    // Tentar matricular aluno 2 na turma A (lotada)
    $this->actingAs($admin, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turmaA->id_turma,
        'usuario_id' => $aluno2->id,
    ])->assertStatus(422)
        ->assertJsonPath('message', 'A turma já atingiu a capacidade máxima de alunos.');

    // Listar alunos matriculados na turma
    $this->actingAs($admin, 'sanctum')->getJson("/api/turmas/{$turmaA->id_turma}/alunos")
        ->assertOk()
        ->assertJsonFragment(['id' => $aluno1->id]);

    // Transferir aluno 1 para turma B
    $this->actingAs($admin, 'sanctum')->patchJson("/api/matriculas/{$matriculaId}/transferir", [
        'nova_turma_id' => $turmaB->id_turma,
    ])->assertOk()
        ->assertJsonPath('nova_matricula.turma_id', $turmaB->id_turma);

    // Cancelar matrícula
    $this->actingAs($admin, 'sanctum')->patchJson("/api/matriculas/{$matriculaId}/cancelar", [
        'status_matricula' => 'Transferido',
    ])->assertOk()
        ->assertJsonPath('status_matricula', 'Transferido');

    // Aluno consulta suas turmas
    $this->actingAs($aluno1, 'sanctum')->getJson('/api/me/turmas')
        ->assertOk()
        ->assertJsonFragment(['id_turma' => $turmaB->id_turma]);
});
