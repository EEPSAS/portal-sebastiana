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

test('especialista pode consultar alunos disponiveis para matricula na turma', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $alunoMatriculado = User::factory()->create(['name' => 'Aluno Ja Matriculado', 'role' => UserRole::ALUNO]);
    $alunoDisponivel = User::factory()->create(['name' => 'Aluno Disponivel', 'role' => UserRole::ALUNO]);

    $turma = Turma::factory()->create(['status' => 'Ativa']);

    // Matricula o primeiro aluno
    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoMatriculado->id,
    ])->assertCreated();

    // Consulta alunos disponíveis
    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/alunos-disponiveis");

    $response->assertOk()
        ->assertJsonFragment(['id' => $alunoDisponivel->id])
        ->assertJsonMissing(['id' => $alunoMatriculado->id]);
});

test('especialista e professor podem consultar resumo geral das turmas, mas aluno e bloqueado', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $professor = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);

    $turma = Turma::factory()->create(['nome_identificador' => '3º Ano Info', 'status' => 'Ativa']);

    $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/turmas/resumo-geral')
        ->assertOk()
        ->assertJsonFragment(['nome_identificador' => '3º Ano Info']);

    $this->actingAs($professor, 'sanctum')
        ->getJson('/api/turmas/resumo-geral')
        ->assertOk();

    $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/turmas/resumo-geral')
        ->assertForbidden();
});

test('bloqueia exclusao de turma com alunos matriculados ativos e permite quando vazia', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);

    $turma = Turma::factory()->create(['status' => 'Ativa']);

    // Matricula aluno
    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
    ])->assertCreated();

    // Tenta excluir turma com aluno ativo -> deve dar 422
    $this->actingAs($especialista, 'sanctum')
        ->deleteJson("/api/turmas/{$turma->id_turma}")
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Não é possível excluir uma turma que possui estudantes com matrícula ativa. Desvincule ou transfira os alunos primeiro.']);

    // Cancela a matrícula (desvincula)
    $matricula = $turma->matriculas()->first();
    $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/matriculas/{$matricula->id_matricula}/cancelar", [
            'status_matricula' => 'Evadido',
        ])->assertOk();

    // Agora deve permitir excluir a turma -> 204
    $this->actingAs($especialista, 'sanctum')
        ->deleteJson("/api/turmas/{$turma->id_turma}")
        ->assertNoContent();
});

test('aluno desvinculado pode ser rematriculado na mesma turma reativando o vinculo', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);
    $turma = Turma::factory()->create(['status' => 'Ativa']);

    // 1. Primeira matrícula
    $resp = $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
    ])->assertCreated();

    $matriculaId = $resp->json('id_matricula');

    // 2. Desvincula
    $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/matriculas/{$matriculaId}/cancelar", [
            'status_matricula' => 'Evadido',
        ])->assertOk();

    // 3. Rematricula na mesma turma -> deve reativar com sucesso (200)
    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
    ])->assertOk()
        ->assertJsonPath('status_matricula', 'Ativo')
        ->assertJsonPath('id_matricula', $matriculaId);
});

test('especialista e professor podem listar todas as matriculas ativas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $alunoAtivo = User::factory()->create(['name' => 'Aluno Matriculado Ativo', 'role' => UserRole::ALUNO]);
    $alunoEvadido = User::factory()->create(['name' => 'Aluno Desvinculado', 'role' => UserRole::ALUNO]);
    $turma = Turma::factory()->create();

    // Matricula aluno ativo
    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoAtivo->id,
    ])->assertCreated();

    // Matricula e desvincula segundo aluno
    $respEvadido = $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoEvadido->id,
    ])->assertCreated();

    $this->actingAs($especialista, 'sanctum')->patchJson("/api/matriculas/{$respEvadido->json('id_matricula')}/cancelar", [
        'status_matricula' => 'Evadido',
    ])->assertOk();

    // Consulta listagem geral de matrículas
    $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/matriculas')
        ->assertOk()
        ->assertJsonFragment(['name' => 'Aluno Matriculado Ativo'])
        ->assertJsonMissing(['name' => 'Aluno Desvinculado']);
});
