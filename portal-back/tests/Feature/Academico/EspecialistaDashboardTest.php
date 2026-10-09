<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\UploadedFile;

test('especialista consulta o resumo gerencial da turma com KPIs e distribuicao de notas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create(['nome' => 'Matemática']);

    // Criar alunos matriculados
    $aluno1 = User::factory()->create(['name' => 'Aluno Excelente']);
    $aluno2 = User::factory()->create(['name' => 'Aluno Medio']);
    $aluno3 = User::factory()->create(['name' => 'Aluno Critico']);

    foreach ([$aluno1, $aluno2, $aluno3] as $aluno) {
        Matricula::factory()->create([
            'turma_id' => $turma->id_turma,
            'usuario_id' => $aluno->id,
            'status_matricula' => 'Ativo',
        ]);
    }

    // Lançar notas (1º Bimestre)
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno1->id,
        'valor_nota' => 9.5,
        'periodo_letivo' => '1º Bimestre',
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno2->id,
        'valor_nota' => 7.0,
        'periodo_letivo' => '1º Bimestre',
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno3->id,
        'valor_nota' => 4.5,
        'periodo_letivo' => '1º Bimestre',
    ]);

    // Lançar presenças e faltas
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno1->id,
        'quantidade_aulas' => 2,
        'status_presenca' => 'Presente',
    ]);
    Frequencia::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno3->id,
        'quantidade_aulas' => 2,
        'status_presenca' => 'Falta',
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/resumo-gerencial?trimestre=1");

    $response->assertOk()
        ->assertJsonStructure([
            'turma' => ['id_turma', 'nome_identificador', 'total_alunos'],
            'kpis' => ['media_geral_turma', 'taxa_absenteismo', 'taxa_presenca', 'total_alunos_ativos'],
            'distribuicao_desempenho' => ['excelentes', 'na_media', 'criticos'],
        ]);

    expect($response->json('kpis.media_geral_turma'))->toEqual(7.0)
        ->and($response->json('distribuicao_desempenho.excelentes.quantidade'))->toBe(1)
        ->and($response->json('distribuicao_desempenho.na_media.quantidade'))->toBe(1)
        ->and($response->json('distribuicao_desempenho.criticos.quantidade'))->toBe(1);
});

test('especialista consulta o ranking de componentes da turma ordenado da pior para a melhor media', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    $fisica = Disciplina::factory()->create(['nome' => 'Física']);
    $historia = Disciplina::factory()->create(['nome' => 'História']);

    $aluno = User::factory()->create();
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    // Física fica com média pior (4.0), História fica com média melhor (8.0)
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $fisica->id_disciplina,
        'usuario_id' => $aluno->id,
        'valor_nota' => 4.0,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $historia->id_disciplina,
        'usuario_id' => $aluno->id,
        'valor_nota' => 8.0,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/desempenho-componentes");

    $response->assertOk();

    $ranking = $response->json('ranking_componentes');
    expect($ranking)->toHaveCount(2)
        ->and($ranking[0]['disciplina_id'])->toBe($fisica->id_disciplina)
        ->and($ranking[0]['status_alerta'])->toBe('critico')
        ->and($ranking[1]['disciplina_id'])->toBe($historia->id_disciplina)
        ->and($ranking[1]['status_alerta'])->toBe('estavel');
});

test('especialista lista alunos em risco critico na turma', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disc1 = Disciplina::factory()->create(['nome' => 'Química']);
    $disc2 = Disciplina::factory()->create(['nome' => 'Biologia']);

    $alunoRisco = User::factory()->create(['name' => 'Aluno em Risco']);
    $alunoBom = User::factory()->create(['name' => 'Aluno Seguro']);

    foreach ([$alunoRisco, $alunoBom] as $a) {
        Matricula::factory()->create([
            'turma_id' => $turma->id_turma,
            'usuario_id' => $a->id,
            'status_matricula' => 'Ativo',
        ]);
    }

    // Aluno em risco com 2 notas abaixo de 6.0
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc1->id_disciplina,
        'usuario_id' => $alunoRisco->id,
        'valor_nota' => 4.0,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc2->id_disciplina,
        'usuario_id' => $alunoRisco->id,
        'valor_nota' => 5.0,
    ]);

    // Aluno bom
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disc1->id_disciplina,
        'usuario_id' => $alunoBom->id,
        'valor_nota' => 9.0,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/alunos-criticos");

    $response->assertOk()
        ->assertJsonPath('total_criticos', 1)
        ->assertJsonPath('alunos_criticos.0.aluno_id', $alunoRisco->id);

    expect($response->json('alunos_criticos.0.total_disciplinas_criticas'))->toBe(2);
});

test('especialista consulta analise detalhada e alunos em risco de um componente especifico', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create(['nome' => 'Geografia']);

    $aluno1 = User::factory()->create(['name' => 'Ana']);
    $aluno2 = User::factory()->create(['name' => 'Bruno']);

    foreach ([$aluno1, $aluno2] as $a) {
        Matricula::factory()->create([
            'turma_id' => $turma->id_turma,
            'usuario_id' => $a->id,
            'status_matricula' => 'Ativo',
        ]);
    }

    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno1->id,
        'valor_nota' => 9.0,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno2->id,
        'valor_nota' => 3.5,
    ]);

    // Análise detalhada
    $resDetalhada = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/disciplinas/{$disciplina->id_disciplina}/analise-detalhada");

    $resDetalhada->assertOk()
        ->assertJsonPath('estatisticas.media_turma', 6.25)
        ->assertJsonPath('estatisticas.maior_nota', 9)
        ->assertJsonPath('estatisticas.menor_nota', 3.5);

    // Alunos em risco na disciplina
    $resRisco = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/disciplinas/{$disciplina->id_disciplina}/alunos-risco");

    $resRisco->assertOk()
        ->assertJsonPath('total_em_risco', 1)
        ->assertJsonPath('alunos_em_risco.0.aluno_id', $aluno2->id)
        ->assertJsonPath('alunos_em_risco.0.media_disciplina', 3.5);
});

test('especialista importa relatorio em planilha CSV consolidada e sincroniza registros', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create(['nome_identificador' => '3º Ano Informática']);

    $discPortugues = Disciplina::factory()->create(['nome' => 'Português']);
    $discMatematica = Disciplina::factory()->create(['nome' => 'Matemática']);

    $aluno1 = User::factory()->create(['name' => 'Carlos Silva', 'email' => 'carlos@escola.mg.gov.br']);
    $aluno2 = User::factory()->create(['name' => 'Daniela Ramos', 'email' => 'daniela@escola.mg.gov.br']);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno1->id,
        'status_matricula' => 'Ativo',
    ]);
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno2->id,
        'status_matricula' => 'Ativo',
    ]);

    // CSV simulando diário escolar sujo com cabeçalhos iniciais
    $csvContent = implode("\n", [
        'ESCOLA ESTADUAL PROFESSORA SEBASTIANA DE ALMEIDA E SILVA',
        'DIARIO DE CLASSE CONSOLIDADO - 2026',
        'Turma: 3º Ano Informática - Turno Matutino',
        'Aluno;Português;Matemática;Faltas Português',
        'Carlos Silva;8,5;9,0;0',
        'Daniela Ramos;6,0;4,5;3',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_consolidado.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
        'periodo_letivo' => '1º Bimestre',
        'data_aula' => '2026-03-25',
    ]);

    $response->assertOk()
        ->assertJsonPath('dados.alunos_identificados', 2)
        ->assertJsonPath('dados.notas_sincronizadas', 4)
        ->assertJsonPath('dados.frequencias_sincronizadas', 2);

    // Validação de gravação das notas no banco
    expect(Nota::where('turma_id', $turma->id_turma)
        ->where('disciplina_id', $discPortugues->id_disciplina)
        ->where('usuario_id', $aluno1->id)
        ->value('valor_nota'))->toBe(8.5);

    expect(Nota::where('turma_id', $turma->id_turma)
        ->where('disciplina_id', $discMatematica->id_disciplina)
        ->where('usuario_id', $aluno2->id)
        ->value('valor_nota'))->toBe(4.5);

    // Validação de gravação das faltas no banco
    expect(Frequencia::where('turma_id', $turma->id_turma)
        ->where('disciplina_id', $discPortugues->id_disciplina)
        ->where('usuario_id', $aluno2->id)
        ->value('status_presenca'))->toBe('Falta');
});

test('usuario padrao nao pode acessar endpoints do dashboard do especialista', function () {
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);
    $turma = Turma::factory()->create();

    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/resumo-gerencial");

    $response->assertForbidden();
});

test('especialista processa o arquivo oficial de diario escolar da EEPSAS com cabecalho multilinha e 22 disciplinas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create([
        'nome_identificador' => '3º DESENV DE SISTEMAS EM INT 1 (2026)',
    ]);

    $csvOficial = <<<'CSV'
ESCOLA: 361453 - EE PROFESSORA SEBASTIANA DE ALMEIDA E SILVA - SRE CORONEL FABRICIANO,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
"TURMA: 3º DESENV DE SISTEMAS EM INT 1 (2026) - 2049481 - INTEGRAL - R SÃO JOSÉ ,30",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
DATA E HORA DA EXTRAÇÃO: 08/10/2026 16:02,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
DIVISÃO: 1º TRIMESTRE,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
ALUNO,LÍNGUA PORTUGUESA,,MATEMÁTICA,,FÍSICA,,HISTÓRIA,,PRÁTICA PROFISSIONAL E EMPREENDEDORA,,GEOGRAFIA,,EDUCAÇÃO FÍSICA,,ESTUDOS ORIENTADOS,,QUÍMICA,,BIOLOGIA,,CONCEITOS AVANÇADOS EM ARQUITETURA DE,,LÍNGUA INGLESA,,FILOSOFIA,,PROJETO DE VIDA,,SOCIOLOGIA,,ARTE,,ELETIVA,,DESENVOLVIMENTO FRONT-END II,,DESENVOLVIMENTO DE SOFTWARES,,FUNDAMENTOS DE SEGURANÇA DE SOFTWARES,,DESENVOLVIMENTO BACK-END,,DESENVOLVIMENTO DE APLICATIVOS,
,,,,,,,,,,,,,,,,,,,,,SISTEMAS,,,,,,,,,,,,,,,,,,,,,,,
,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS,1º TRIMESTRE,FALTAS
ANA LÍVIA DE SOUZA RAMOS,28.7,3,29.8,3,25.0,1,28.8,0,28.0,0,30.0,1,28.0,0,20.0,2,30.0,0,27.0,0,30.0,0,25.7,0,30.0,1,29.0,4,28.8,1,26.0,0,28.0,0,30.0,0,30.0,0,30.0,0,30.0,0,30.0,0
CARLOS EDUARDO BARROS ARAUJO,23.2,20,18.0,14,18.0,6,22.2,0,24.0,16,19.7,10,28.0,0,18.0,8,21.0,3,21.0,3,19.0,0,22.8,5,24.2,6,27.8,7,28.0,3,20.0,5,28.0,0,19.0,0,19.0,0,19.0,0,19.0,0,19.0,4
RHAYNNER MATEUS GONÇALVES DIAS,25.8,3,30.0,2,21.0,1,25.8,2,25.5,6,25.4,4,28.0,0,18.0,3,27.0,0,26.0,0,20.0,0,25.9,1,30.0,2,30.0,4,28.8,0,24.0,0,28.0,0,20.0,0,20.0,0,20.0,0,20.0,0,20.0,0
YASMIM GOMES OLIVEIRA,26.0,12,23.6,9,24.0,2,25.6,4,26.5,10,22.9,8,28.0,0,20.0,4,25.0,1,27.0,0,22.0,0,26.8,3,27.8,2,27.8,4,29.0,2,26.0,2,28.0,0,22.0,0,22.0,0,22.0,0,22.0,0,22.0,0
YASMIN TEIXEIRA SANTOS,28.3,13,26.6,11,24.0,6,28.2,2,26.5,14,26.1,6,28.0,2,20.0,6,29.0,0,25.0,1,21.0,0,26.1,3,30.0,3,30.0,17,30.0,1,26.0,1,28.0,1,21.0,0,21.0,0,21.0,0,21.0,0,21.0,0
CSV;

    $file = UploadedFile::fake()->createWithContent('diario_eepsas_2026.csv', $csvOficial);

    // 1. Upload e importação
    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $file,
    ]);

    $response->assertOk()
        ->assertJsonPath('dados.alunos_identificados', 5)
        ->assertJsonPath('dados.notas_sincronizadas', 110)
        ->assertJsonPath('dados.frequencias_sincronizadas', 110)
        ->assertJsonPath('dados.periodo_aplicado', '1º TRIMESTRE')
        ->assertJsonPath('dados.data_referencia', '2026-10-08');

    // Valida que a disciplina multilinha "CONCEITOS AVANÇADOS EM ARQUITETURA DE SISTEMAS" foi criada e vinculada
    $discMultilinha = Disciplina::where('nome', 'CONCEITOS AVANÇADOS EM ARQUITETURA DE SISTEMAS')->first();
    expect($discMultilinha)->not->toBeNull();

    // Valida a nota de Ana Lívia na disciplina multilinha (30.0)
    $anaLivia = User::where('name', 'ANA LÍVIA DE SOUZA RAMOS')->first();
    expect(Nota::where('turma_id', $turma->id_turma)
        ->where('disciplina_id', $discMultilinha->id_disciplina)
        ->where('usuario_id', $anaLivia->id)
        ->value('valor_nota'))->toEqual(30.0);

    // 2. Resumo Gerencial da turma com o filtro do 1º Trimestre detectado
    $resResumo = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/resumo-gerencial?trimestre=1");

    $resResumo->assertOk()
        ->assertJsonPath('kpis.total_alunos_ativos', 5)
        ->assertJsonPath('kpis.total_alunos_avaliados', 5);

    // 3. Alunos críticos: Carlos Eduardo e Yasmin Teixeira (devido ao acúmulo severo de faltas e notas limítrofes)
    $resCriticos = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/alunos-criticos");

    $resCriticos->assertOk();
    $nomesCriticos = collect($resCriticos->json('alunos_criticos'))->pluck('nome')->toArray();
    expect($nomesCriticos)->toContain('CARLOS EDUARDO BARROS ARAUJO')
        ->and($nomesCriticos)->toContain('YASMIN TEIXEIRA SANTOS');

    // 4. Ranking de componentes curriculares
    $resDesempenho = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/desempenho-componentes");

    $resDesempenho->assertOk();
    expect($resDesempenho->json('ranking_componentes'))->toHaveCount(22);
});

test('especialista lista as notas detalhadas registradas para uma turma', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create(['nome' => 'Matemática']);
    $aluno = User::factory()->create(['name' => 'Aluno Teste']);

    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'valor_nota' => 8.5,
        'periodo_letivo' => '1º Bimestre',
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/notas");

    $response->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.valor_nota', 8.5)
        ->assertJsonPath('0.aluno.name', 'Aluno Teste')
        ->assertJsonPath('0.disciplina.nome', 'Matemática');
});
