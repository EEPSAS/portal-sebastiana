<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Http\UploadedFile;

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

    // Consultar, atualizar e excluir disciplina, além de validar FormRequests de vínculo (422)
    $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/disciplinas/{$disciplinaId}/vincular-professor", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['professor_id', 'turma_id']);

    $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/disciplinas", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['disciplina_id']);

    $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/disciplinas/{$disciplinaId}")
        ->assertOk()
        ->assertJsonPath('nome', 'Banco de Dados');

    $this->actingAs($especialista, 'sanctum')
        ->putJson("/api/disciplinas/{$disciplinaId}", [
            'nome' => 'Banco de Dados Relacional',
            'aulas_semanais' => 3,
        ])
        ->assertOk()
        ->assertJsonPath('nome', 'Banco de Dados Relacional')
        ->assertJsonPath('carga_horaria_anual', 120);

    $this->actingAs($especialista, 'sanctum')
        ->deleteJson("/api/disciplinas/{$disciplinaId}")
        ->assertNoContent();
});

test('matricula de aluno respeita capacidade maxima e permite transferir e cancelar', function () {
    $admin = User::factory()->create(['role' => UserRole::ADM]);
    $aluno1 = User::factory()->create(['role' => UserRole::ALUNO]);
    $aluno2 = User::factory()->create(['role' => UserRole::ALUNO]);

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

    // Transferir aluno 1 para turma B (valida FormRequest 422 primeiro)
    $this->actingAs($admin, 'sanctum')->patchJson("/api/matriculas/{$matriculaId}/transferir", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nova_turma_id']);

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

test('especialista pode consultar alunos disponiveis para matricula e alunos matriculados em qualquer turma sao excluidos', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $alunoMatriculadoTurmaA = User::factory()->create(['name' => 'Aluno Matriculado Turma A', 'role' => UserRole::ALUNO]);
    $alunoMatriculadoTurmaB = User::factory()->create(['name' => 'Aluno Matriculado Turma B', 'role' => UserRole::ALUNO]);
    $alunoDisponivel = User::factory()->create(['name' => 'Aluno Disponivel', 'role' => UserRole::ALUNO]);

    $turmaA = Turma::factory()->create(['status' => 'Ativa']);
    $turmaB = Turma::factory()->create(['status' => 'Ativa']);

    // Matricula os alunos em turmas diferentes
    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turmaA->id_turma,
        'usuario_id' => $alunoMatriculadoTurmaA->id,
    ])->assertCreated();

    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turmaB->id_turma,
        'usuario_id' => $alunoMatriculadoTurmaB->id,
    ])->assertCreated();

    // Consulta alunos disponíveis na Turma A
    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turmaA->id_turma}/alunos-disponiveis");

    $response->assertOk()
        ->assertJsonFragment(['id' => $alunoDisponivel->id])
        ->assertJsonMissing(['id' => $alunoMatriculadoTurmaA->id])
        ->assertJsonMissing(['id' => $alunoMatriculadoTurmaB->id]);
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

test('contagem de total_alunos da turma atualiza imediatamente ao desvincular aluno', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $aluno1 = User::factory()->create(['role' => UserRole::ALUNO]);
    $aluno2 = User::factory()->create(['role' => UserRole::ALUNO]);
    $turma = Turma::factory()->create(['status' => 'Ativa']);

    // Matricula 2 alunos na turma
    $resp1 = $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno1->id,
    ])->assertCreated();

    $this->actingAs($especialista, 'sanctum')->postJson('/api/matriculas', [
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno2->id,
    ])->assertCreated();

    // Verifica que a turma tem total_alunos = 2
    $this->actingAs($especialista, 'sanctum')->getJson('/api/turmas')
        ->assertOk()
        ->assertJsonFragment([
            'id_turma' => $turma->id_turma,
            'total_alunos' => 2,
        ]);

    // Desvincula aluno 1 (Evadido)
    $this->actingAs($especialista, 'sanctum')->patchJson("/api/matriculas/{$resp1->json('id_matricula')}/cancelar", [
        'status_matricula' => 'Evadido',
    ])->assertOk();

    // Verifica que a contagem total_alunos da turma agora é 1
    $this->actingAs($especialista, 'sanctum')->getJson('/api/turmas')
        ->assertOk()
        ->assertJsonFragment([
            'id_turma' => $turma->id_turma,
            'total_alunos' => 1,
        ]);
});

test('especialista pode consultar notas filtrando por aluno individual para nao carregar todos de uma vez', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disc = Disciplina::factory()->create(['nome' => 'Matemática']);
    $aluno1 = User::factory()->create(['name' => 'Aluno Um', 'role' => UserRole::ALUNO]);
    $aluno2 = User::factory()->create(['name' => 'Aluno Dois', 'role' => UserRole::ALUNO]);

    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc->id_disciplina,
        'usuario_id' => $aluno1->id,
        'valor_nota' => 9.0,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc->id_disciplina,
        'usuario_id' => $aluno2->id,
        'valor_nota' => 7.0,
    ]);

    // Consulta filtrando por aluno1
    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/notas?aluno_id={$aluno1->id}");

    $response->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.aluno.name', 'Aluno Um')
        ->assertJsonPath('0.valor_nota', 9);
});

test('especialista pode excluir dados do csv de uma turma filtrando pelo periodo letivo', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disc = Disciplina::factory()->create(['nome' => 'História']);
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);

    // Notas de 1º Trimestre e 2º Trimestre
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 8.0,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '2º Trimestre',
        'valor_nota' => 9.0,
    ]);

    // Frequência de 1º Trimestre (mês 03)
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-15',
        'quantidade_aulas' => 2,
        'status_presenca' => 'Falta',
    ]);

    // Exclui apenas dados do 1º Trimestre
    $response = $this->actingAs($especialista, 'sanctum')
        ->deleteJson("/api/turmas/{$turma->id_turma}/dados-csv?periodo_letivo=1º Trimestre");

    $response->assertOk()
        ->assertJsonPath('notas_removidas', 1)
        ->assertJsonPath('frequencias_removidas', 1);

    // Nota de 1º Trimestre foi excluída
    expect(Nota::where('turma_id', $turma->id_turma)->where('periodo_letivo', '1º Trimestre')->exists())->toBeFalse();

    // Nota de 2º Trimestre permanece intacta
    expect(Nota::where('turma_id', $turma->id_turma)->where('periodo_letivo', '2º Trimestre')->exists())->toBeTrue();
});

test('aluno comum nao pode excluir dados do csv de uma turma (403)', function () {
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);
    $turma = Turma::factory()->create();

    $this->actingAs($aluno, 'sanctum')
        ->deleteJson("/api/turmas/{$turma->id_turma}/dados-csv")
        ->assertForbidden();
});

test('importacao csv reconhece aluno com nome completo quando email institucional tem apenas primeiro e ultimo nome', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create(['nome_identificador' => '3º Ano Informática', 'ano_letivo' => 2026]);
    Disciplina::factory()->create(['nome' => 'Matemática']);

    // Aluno já cadastrado no sistema com e-mail institucional primeiro.ultimo e nome civil
    $aluno = User::factory()->create([
        'name' => 'Yasmin Santos',
        'email' => 'yasmin.santos@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    // Matrícula ativa na turma
    Matricula::create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);

    // CSV trazendo o nome completo com sobrenome do meio
    $conteudoCsv = "Aluno;Matemática\nYASMIN TEIXEIRA SANTOS;9,5";
    $arquivo = UploadedFile::fake()->createWithContent('notas.csv', $conteudoCsv);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivo,
        'periodo_letivo' => '1º Trimestre',
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'sucesso')
        ->assertJsonPath('dados.notas_sincronizadas', 1);

    // Verifica que a nota foi vinculada ao aluno existente Yasmin Santos (sem criar usuário duplicado)
    $nota = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->first();

    expect($nota)->not->toBeNull()
        ->and($nota->valor_nota)->toEqual(9.5);

    // Não deve existir outro usuário criado
    expect(User::where('name', 'YASMIN TEIXEIRA SANTOS')->exists())->toBeFalse();
});

test('importacao csv detecta homonimos e retorna status pendente_confirmacao com candidatos', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create(['nome_identificador' => '3º Ano B', 'ano_letivo' => 2026]);
    Disciplina::factory()->create(['nome' => 'História']);

    // Dois alunos com primeiro nome Lucas e último Lima na mesma turma (homônimos parciais)
    $aluno1 = User::factory()->create([
        'name' => 'Lucas Ferreira Lima',
        'email' => 'lucas.lima@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);
    $aluno2 = User::factory()->create([
        'name' => 'Lucas Gabriel Lima',
        'email' => 'lucas.gabriel.lima@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    Matricula::create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno1->id, 'data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);
    Matricula::create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno2->id, 'data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);

    // CSV traz "LUCAS LIMA"
    $conteudoCsv = "Aluno;História\nLUCAS LIMA;8,0";
    $arquivo = UploadedFile::fake()->createWithContent('notas.csv', $conteudoCsv);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivo,
        'periodo_letivo' => '1º Trimestre',
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'pendente_confirmacao')
        ->assertJsonCount(1, 'ambiguidades')
        ->assertJsonPath('ambiguidades.0.nome_csv', 'LUCAS LIMA')
        ->assertJsonCount(2, 'ambiguidades.0.candidatos');

    // Nenhuma nota foi gravada ainda
    expect(Nota::where('turma_id', $turma->id_turma)->count())->toBe(0);
});

test('importacao csv com mapeamentos_alunos resolve homonimos e sincroniza notas com aluno confirmado', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create(['nome_identificador' => '3º Ano C', 'ano_letivo' => 2026]);
    Disciplina::factory()->create(['nome' => 'Física']);

    $aluno1 = User::factory()->create(['name' => 'Lucas Ferreira Lima', 'email' => 'lucas.lima1@aluno.mg.gov.br', 'role' => UserRole::ALUNO]);
    $aluno2 = User::factory()->create(['name' => 'Lucas Gabriel Lima', 'email' => 'lucas.lima2@aluno.mg.gov.br', 'role' => UserRole::ALUNO]);

    Matricula::create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno1->id, 'data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);
    Matricula::create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno2->id, 'data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);

    $conteudoCsv = "Aluno;Física\nLUCAS LIMA;10,0";
    $arquivo = UploadedFile::fake()->createWithContent('notas.csv', $conteudoCsv);

    // Especialista confirma manualmente que LUCAS LIMA é o aluno2 ($aluno2->id)
    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivo,
        'periodo_letivo' => '1º Trimestre',
        'mapeamentos_alunos' => [
            'LUCAS LIMA' => $aluno2->id,
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'sucesso')
        ->assertJsonPath('dados.notas_sincronizadas', 1);

    // Nota vinculada especificamente ao aluno2
    expect(Nota::where('turma_id', $turma->id_turma)->where('usuario_id', $aluno2->id)->value('valor_nota'))->toEqual(10.0);
    expect(Nota::where('turma_id', $turma->id_turma)->where('usuario_id', $aluno1->id)->exists())->toBeFalse();
});

test('disciplinas por ciclos calculam carga anual, propagam para turmas do ciclo e conciliam CSV com ciclo_id', function () {
    $especialista = User::factory()->create([
        'role' => UserRole::ESPECIALISTA,
        'status_confirmacao' => 'confirmado',
    ]);
    $professor = User::factory()->create([
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);
    $aluno = User::factory()->create([
        'name' => 'Helena Soares',
        'email' => 'helena.soares@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'status_confirmacao' => 'confirmado',
    ]);

    $this->actingAs($especialista, 'sanctum');

    $resDisc = $this->postJson('/api/disciplinas', [
        'nome' => 'Biologia Molecular',
        'aulas_semanais' => 4,
        'novo_ciclo_nome' => '1º Ano',
        'ementa' => 'Estudo das células e genética.',
        'habilidades_bncc' => 'EM13CNT201',
        'objetivo_geral' => 'Compreender os processos celulares.',
        'objetivo_especifico' => 'Analisar DNA e RNA.',
        'professor_ids' => [$professor->id],
    ])->assertCreated()
        ->assertJsonPath('aulas_semanais', 4)
        ->assertJsonPath('carga_horaria_anual', 160);

    $ciclo = Ciclo::where('nome', '1º Ano')->firstOrFail();

    $resTurma = $this->postJson('/api/turmas', [
        'nome_identificador' => '1º Ano B - Integral',
        'ciclo_id' => $ciclo->id_ciclo,
        'turno' => 'Integral',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ])->assertCreated();

    $turmaId = $resTurma->json('id_turma');
    $turma = Turma::findOrFail($turmaId);
    expect($turma->turmaDisciplinas()->where('professor_id', $professor->id)->count())->toBe(1);

    $this->postJson('/api/matriculas', [
        'turma_id' => $turmaId,
        'usuario_id' => $aluno->id,
    ])->assertCreated();

    $csvConteudo = "Aluno;Biologia Molecular;Robótica Educacional\nHelena Soares;9,0;8,5";
    $arquivo = UploadedFile::fake()->createWithContent('notas.csv', $csvConteudo);

    $this->post("/api/turmas/{$turmaId}/importar-relatorio", [
        'arquivo' => $arquivo,
        'periodo_letivo' => '1º Trimestre',
        'exigir_conciliacao_disciplinas' => '1',
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('status', 'pendente_confirmacao')
        ->assertJsonPath('tipo_pendencia', 'conciliacao_disciplinas');

    $arquivoConfirmado = UploadedFile::fake()->createWithContent('notas.csv', $csvConteudo);
    $this->post("/api/turmas/{$turmaId}/importar-relatorio", [
        'arquivo' => $arquivoConfirmado,
        'periodo_letivo' => '1º Trimestre',
        'exigir_conciliacao_disciplinas' => '1',
        'mapeamentos_disciplinas' => json_encode([
            'Robótica Educacional' => [
                'acao' => 'criar_nova',
                'nome_nova' => 'Robótica Educacional',
                'aulas_semanais' => 2,
                'ciclo_id' => $ciclo->id_ciclo,
            ],
        ]),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('status', 'sucesso');

    $novaDisc = Disciplina::where('nome', 'Robótica Educacional')->first();
    expect($novaDisc)->not->toBeNull()
        ->and($novaDisc->aulas_semanais)->toBe(2)
        ->and($novaDisc->carga_horaria_anual)->toBe(80)
        ->and($novaDisc->ciclos->pluck('id_ciclo')->all())->toContain($ciclo->id_ciclo);
});

test('separacao de jornadas garante isolamento estrito de ciclos, disciplinas e notas entre professor e especialista', function () {
    $ciclo1 = Ciclo::firstOrCreate(['nome' => '1º Ano EM']);
    $ciclo2 = Ciclo::firstOrCreate(['nome' => '2º Ano EM']);

    $turma1 = Turma::create([
        'nome_identificador' => '1º Ano A',
        'ciclo_id' => $ciclo1->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);
    $turma2 = Turma::create([
        'nome_identificador' => '2º Ano A',
        'ciclo_id' => $ciclo2->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $discQuimica = Disciplina::create(['nome' => 'Química Orgânica', 'aulas_semanais' => 2]);
    $discQuimica->ciclos()->sync([$ciclo1->id_ciclo]);

    $discBiologia = Disciplina::create(['nome' => 'Biologia Celular', 'aulas_semanais' => 2]);
    $discBiologia->ciclos()->sync([$ciclo2->id_ciclo]);

    $profQuimica = User::factory()->create([
        'name' => 'Prof. Walter',
        'email' => 'walter.quimica@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);
    $profQuimica->disciplinasDocente()->sync([$discQuimica->id_disciplina]);

    $especialista = User::factory()->create([
        'name' => 'Especialista Mariana',
        'email' => 'mariana.esp@sebastiana.edu.br',
        'role' => UserRole::ESPECIALISTA,
        'status_confirmacao' => 'confirmado',
    ]);

    $discQuimica->sincronizarComTurmasDosCiclos();
    $discBiologia->sincronizarComTurmasDosCiclos();

    $this->actingAs($profQuimica, 'sanctum');
    $resCiclosProf = $this->getJson('/api/ciclos')->assertOk();
    $cicloNomes = collect($resCiclosProf->json('data') ?? [])->pluck('nome')->all();

    expect($cicloNomes)->toContain('1º Ano EM')
        ->and($cicloNomes)->not->toContain('2º Ano EM');

    $resDiscProf = $this->getJson('/api/disciplinas')->assertOk();
    $discIdsProf = collect($resDiscProf->json())->pluck('id_disciplina')->all();
    expect($discIdsProf)->toContain($discQuimica->id_disciplina)
        ->and($discIdsProf)->not->toContain($discBiologia->id_disciplina);

    $this->getJson("/api/turmas/{$turma2->id_turma}/notas")->assertForbidden();
    $this->getJson("/api/turmas/{$turma1->id_turma}/notas")->assertOk();

    $this->actingAs($especialista, 'sanctum');
    $resCiclosEsp = $this->getJson('/api/ciclos')->assertOk();
    $todosCiclosNomes = collect($resCiclosEsp->json('data'))->pluck('nome')->all();
    expect($todosCiclosNomes)->toContain('1º Ano EM', '2º Ano EM');
});
