<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;

test('aluno consulta seu resumo global com media geral, frequencia e alertas de risco', function () {
    $turma = Turma::factory()->create();
    $aluno = User::factory()->create(['role' => UserRole::PADRAO, 'name' => 'Aluno Teste']);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $discMat = Disciplina::factory()->create(['nome' => 'Matemática', 'carga_horaria_anual' => 100]);
    $discPort = Disciplina::factory()->create(['nome' => 'Português', 'carga_horaria_anual' => 100]);

    // Notas: Matemática = 8.0, Português = 4.0 (risco!)
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discMat->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 8.0,
        'valor_maximo' => 10.0,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discPort->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 4.0,
        'valor_maximo' => 10.0,
    ]);

    // Frequência: 10 aulas dadas, 1 falta (90% de presença)
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discMat->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-05',
        'quantidade_aulas' => 8,
        'status_presenca' => 'Presente',
    ]);
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discPort->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-06',
        'quantidade_aulas' => 1,
        'status_presenca' => 'Presente',
    ]);
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discPort->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-07',
        'quantidade_aulas' => 1,
        'status_presenca' => 'Falta',
    ]);

    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/resumo-global?trimestre=1");

    $response->assertOk()
        ->assertJsonStructure([
            'aluno' => ['id', 'nome', 'email'],
            'turma' => ['id_turma', 'nome_identificador'],
            'media_geral',
            'frequencia_global',
            'total_alertas_risco',
            'alertas_risco',
            'student_stats' => [
                'frequenciaGeral' => ['porcentagem', 'classificacao'],
                'mediaNotas' => ['valor', 'comparacao'],
                'leituraAtual',
                'proximaNotificacao',
            ],
        ]);

    // Média de 8.0 e 4.0 = 6.0
    expect($response->json('media_geral'))->toEqual(6.0)
        ->and($response->json('frequencia_global'))->toEqual(90.0)
        ->and($response->json('total_alertas_risco'))->toBe(1)
        ->and($response->json('alertas_risco.0.nome_disciplina'))->toBe('Português');
});

test('aluno consulta o boletim agrupado por disciplina com status e formato grafico', function () {
    $turma = Turma::factory()->create();
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $discMat = Disciplina::factory()->create(['nome' => 'Matemática']);
    $discHist = Disciplina::factory()->create(['nome' => 'História']);

    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discMat->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 8.5,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discHist->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 5.0,
    ]);

    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discMat->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-02',
        'quantidade_aulas' => 2,
        'status_presenca' => 'Presente',
    ]);

    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/boletim?trimestre=1");

    $response->assertOk()
        ->assertJsonStructure([
            'turma_id',
            'aluno_id',
            'boletim' => [
                '*' => [
                    'disciplina_id',
                    'nome_disciplina',
                    'nota_obtida',
                    'somatorio_faltas',
                    'status',
                    'materia',
                    'pontos',
                    'cor',
                ],
            ],
            'grafico_boletim' => [
                '*' => ['id', 'materia', 'pontos', 'cor'],
            ],
        ]);

    $boletim = collect($response->json('boletim'));
    $mat = $boletim->firstWhere('nome_disciplina', 'Matemática');
    $hist = $boletim->firstWhere('nome_disciplina', 'História');

    expect($mat['status'])->toBe('Aprovado')
        ->and($hist['status'])->toBe('Abaixo da Média');
});

test('aluno consulta o comparativo individual vs turma para grafico de radar', function () {
    $turma = Turma::factory()->create();
    $aluno1 = User::factory()->create(['role' => UserRole::PADRAO]);
    $aluno2 = User::factory()->create(['role' => UserRole::PADRAO]);

    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno1->id, 'status_matricula' => 'Ativo']);
    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno2->id, 'status_matricula' => 'Ativo']);

    $discFis = Disciplina::factory()->create(['nome' => 'Física']);

    // Aluno 1: nota 9.0, faltas 0
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discFis->id_disciplina,
        'usuario_id' => $aluno1->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 9.0,
    ]);

    // Aluno 2: nota 5.0, faltas 4
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discFis->id_disciplina,
        'usuario_id' => $aluno2->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 5.0,
    ]);
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $discFis->id_disciplina,
        'usuario_id' => $aluno2->id,
        'data_aula' => '2026-03-03',
        'quantidade_aulas' => 4,
        'status_presenca' => 'Falta',
    ]);

    $response = $this->actingAs($aluno1, 'sanctum')
        ->getJson("/api/alunos/{$aluno1->id}/turmas/{$turma->id_turma}/comparativo-turma?trimestre=1");

    $response->assertOk()
        ->assertJsonStructure([
            'turma_id',
            'aluno_id',
            'comparativo' => [
                '*' => [
                    'disciplina_id',
                    'nome_disciplina',
                    'nota_aluno',
                    'faltas_aluno',
                    'media_turma',
                    'media_faltas_turma',
                ],
            ],
            'radar' => [
                'labels',
                'series',
            ],
        ]);

    $item = collect($response->json('comparativo'))->firstWhere('nome_disciplina', 'Física');
    expect($item['nota_aluno'])->toEqual(9.0)
        ->and($item['faltas_aluno'])->toBe(0)
        ->and($item['media_turma'])->toEqual(7.0) // (9+5)/2
        ->and($item['media_faltas_turma'])->toEqual(2.0); // 4 faltas / 2 alunos
});

test('aluno consulta o detalhamento de desempenho individual por componente curricular', function () {
    $turma = Turma::factory()->create();
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $disciplina = Disciplina::factory()->create([
        'nome' => 'Química',
        'carga_horaria_anual' => 80,
    ]);

    // Nota 4.5: faltam 1.5 para 6.0
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'valor_nota' => 4.5,
    ]);

    // 6 faltas em 80h de carga horária (limite LDB: 25% de 80 = 20) -> saldo: 14
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-04',
        'quantidade_aulas' => 6,
        'status_presenca' => 'Falta',
    ]);

    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/disciplinas/{$disciplina->id_disciplina}/desempenho?trimestre=1");

    $response->assertOk()
        ->assertJsonStructure([
            'turma' => ['id_turma', 'nome_identificador'],
            'disciplina' => ['id_disciplina', 'nome'],
            'avaliacao_nota' => [
                'nota_atual',
                'media_escolar_aprovacao',
                'aprovado',
                'pontos_faltantes',
                'mensagem',
            ],
            'avaliacao_frequencia' => [
                'faltas_aluno',
                'carga_horaria_prevista',
                'percentual_faltas',
                'maximo_faltas_permitidas',
                'saldo_faltas_permitidas',
                'reprovado_por_falta',
                'mensagem',
            ],
        ]);

    expect($response->json('avaliacao_nota.aprovado'))->toBeFalse()
        ->and($response->json('avaliacao_nota.pontos_faltantes'))->toEqual(1.5)
        ->and($response->json('avaliacao_nota.mensagem'))->toContain('Faltam 1.5 pontos')
        ->and($response->json('avaliacao_frequencia.faltas_aluno'))->toBe(6)
        ->and($response->json('avaliacao_frequencia.maximo_faltas_permitidas'))->toBe(20)
        ->and($response->json('avaliacao_frequencia.saldo_faltas_permitidas'))->toBe(14)
        ->and($response->json('avaliacao_frequencia.reprovado_por_falta'))->toBeFalse();
});

test('aluno comum nao pode acessar dashboard de outro aluno (403)', function () {
    $turma = Turma::factory()->create();
    $aluno1 = User::factory()->create(['role' => UserRole::PADRAO]);
    $aluno2 = User::factory()->create(['role' => UserRole::PADRAO]);

    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno1->id, 'status_matricula' => 'Ativo']);
    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno2->id, 'status_matricula' => 'Ativo']);

    $response = $this->actingAs($aluno1, 'sanctum')
        ->getJson("/api/alunos/{$aluno2->id}/turmas/{$turma->id_turma}/resumo-global");

    $response->assertForbidden();
});

test('especialista e administrador podem visualizar o dashboard de qualquer aluno (200)', function () {
    $turma = Turma::factory()->create();
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);

    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno->id, 'status_matricula' => 'Ativo']);

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/resumo-global");

    $response->assertOk();
});

test('retorna 404 caso aluno nao esteja matriculado na turma consultada', function () {
    $turma = Turma::factory()->create();
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    // Sem matrícula na turma
    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/resumo-global");

    $response->assertNotFound();
});
