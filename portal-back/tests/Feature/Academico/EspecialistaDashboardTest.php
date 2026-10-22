<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

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

    $aluno1 = User::factory()->create(['name' => 'Carlos Silva', 'email' => 'carlos@aluno.mg.gov.br']);
    $aluno2 = User::factory()->create(['name' => 'Daniela Ramos', 'email' => 'daniela@aluno.mg.gov.br']);

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

    $nomesAlunos = [
        'ANA LÍVIA DE SOUZA RAMOS',
        'CARLOS EDUARDO BARROS ARAUJO',
        'RHAYNNER MATEUS GONÇALVES DIAS',
        'YASMIM GOMES OLIVEIRA',
        'YASMIN TEIXEIRA SANTOS',
    ];

    foreach ($nomesAlunos as $nomeAluno) {
        $slug = Str::slug($nomeAluno);
        $alunoInst = User::factory()->create([
            'name' => $nomeAluno,
            'email' => "{$slug}@aluno.mg.gov.br",
            'role' => UserRole::ALUNO,
        ]);
        Matricula::factory()->create([
            'turma_id' => $turma->id_turma,
            'usuario_id' => $alunoInst->id,
            'status_matricula' => 'Ativo',
        ]);
    }

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

test('importacao de csv ignora aluno nao cadastrado e nao cria usuario no banco sem permissao do admin', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    Disciplina::factory()->create(['nome' => 'Matemática']);

    $totalUsuariosAntes = User::count();

    // CSV contendo um aluno fictício sem cadastro no sistema
    $csvContent = implode("\n", [
        'Aluno;Matemática',
        'Aluno Fantasma Inexistente;9,5',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_inexistente.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
        'periodo_letivo' => '1º Trimestre',
    ]);

    $response->assertOk()
        ->assertJsonPath('dados.alunos_identificados', 0)
        ->assertJsonPath('dados.total_ignorados', 1)
        ->assertJsonPath('dados.alunos_ignorados.0.nome_csv', 'Aluno Fantasma Inexistente')
        ->assertJsonPath('dados.alunos_ignorados.0.motivo', 'Não cadastrado no sistema');

    // Valida que nenhum novo usuário foi criado no banco
    expect(User::count())->toBe($totalUsuariosAntes)
        ->and(User::where('name', 'Aluno Fantasma Inexistente')->exists())->toBeFalse()
        ->and(Nota::where('turma_id', $turma->id_turma)->count())->toBe(0);
});

test('importacao de csv ignora aluno cadastrado mas sem matricula ativa na turma', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    Disciplina::factory()->create(['nome' => 'História']);

    // Aluno cadastrado com e-mail institucional oficial, mas SEM matrícula nesta turma
    $alunoSemMatricula = User::factory()->create([
        'name' => 'Marcos Vinicius',
        'email' => 'marcos.vinicius@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    $csvContent = implode("\n", [
        'Aluno;História',
        'Marcos Vinicius;8,0',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_sem_matricula.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
        'periodo_letivo' => '1º Trimestre',
    ]);

    $response->assertOk()
        ->assertJsonPath('dados.alunos_identificados', 0)
        ->assertJsonPath('dados.total_ignorados', 1)
        ->assertJsonPath('dados.alunos_ignorados.0.motivo', 'Sem matrícula ativa nesta turma');

    // Nenhuma nota foi persistida e nenhuma matrícula gerada automaticamente
    expect(Nota::where('turma_id', $turma->id_turma)->count())->toBe(0)
        ->and(Matricula::where('turma_id', $turma->id_turma)->where('usuario_id', $alunoSemMatricula->id)->exists())->toBeFalse();
});

test('endpoint de notas lista apenas notas de alunos com e-mail institucional oficial', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create(['nome' => 'Física']);

    // 1. Aluno válido com e-mail institucional oficial
    $alunoInstitucional = User::factory()->create([
        'name' => 'Aluno Institucional',
        'email' => 'aluno.institucional@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $alunoInstitucional->id,
        'valor_nota' => 9.0,
    ]);

    // 2. Aluno legado/não-institucional com e-mail genérico
    $alunoNaoInstitucional = User::factory()->create([
        'name' => 'Aluno Generico',
        'email' => 'aluno.generico@gmail.com',
        'role' => UserRole::ALUNO,
    ]);
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $alunoNaoInstitucional->id,
        'valor_nota' => 5.0,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/notas");

    // Apenas a nota do aluno com e-mail @aluno.mg.gov.br deve aparecer
    $response->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.aluno.name', 'Aluno Institucional')
        ->assertJsonPath('0.aluno.email', 'aluno.institucional@aluno.mg.gov.br');
});

test('importacao de relatorio bloqueia arquivo que nao seja csv retornando mensagem de incompatibilidade', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    // 1. Simula envio de arquivo PDF
    $arquivoPdf = UploadedFile::fake()->create('documento_invalido.pdf', 100, 'application/pdf');

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoPdf,
        'periodo_letivo' => '1º Trimestre',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['arquivo'])
        ->assertJsonFragment([
            'arquivo' => ['O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.'],
        ]);
});

test('importacao de relatorio bloqueia arquivos xlsx e txt retornando erro 422 de formato incompativel', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    // 1. Simula envio de arquivo Excel (.xlsx)
    $arquivoXlsx = UploadedFile::fake()->create('planilha_excel.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $respXlsx = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoXlsx,
    ]);

    $respXlsx->assertStatus(422)
        ->assertJsonValidationErrors(['arquivo'])
        ->assertJsonFragment([
            'arquivo' => ['O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.'],
        ]);

    // 2. Simula envio de arquivo de texto (.txt)
    $arquivoTxt = UploadedFile::fake()->create('diario_notas.txt', 100, 'text/plain');

    $respTxt = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoTxt,
    ]);

    $respTxt->assertStatus(422)
        ->assertJsonValidationErrors(['arquivo'])
        ->assertJsonFragment([
            'arquivo' => ['O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.'],
        ]);
});

test('importacao de relatorio reconhece multiplos trimestres e descarta coluna total', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    $aluno = User::factory()->create([
        'name' => 'Ana Lívia de Souza Ramos',
        'email' => 'ana.ramos@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    // CSV no formato DED MG com múltiplos trimestres, EIR e coluna TOTAL
    $csvContent = implode("\n", [
        'ESCOLA: 361453 - EE PROFESSORA SEBASTIANA DE ALMEIDA E SILVA',
        'TURMA: 3º DESENV DE SISTEMAS EM INT 1',
        'DATA E HORA DA EXTRAÇÃO: 19/10/2026 15:17',
        'DIVISÃO: Todos',
        'ALUNO,LÍNGUA PORTUGUESA,,,,,,MATEMÁTICA,,,,,',
        ',,,,,,,,,,,',
        ',1º TRIMESTRE,2º TRIMESTRE,3º TRIMESTRE,EIR,TOTAL,FALTAS,1º TRIMESTRE,2º TRIMESTRE,3º TRIMESTRE,EIR,TOTAL,FALTAS',
        'ANA LÍVIA DE SOUZA RAMOS,28.7,24.42,-,-,53.12,20,29.8,19.51,20.0,-,69.31,25',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_multi_trimestre.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'sucesso');

    // Verifica que 1º e 2º trimestre de Português foram gravados
    expect(Nota::where('turma_id', $turma->id_turma)->where('usuario_id', $aluno->id)->where('periodo_letivo', '1º Trimestre')->count())->toBe(2)
        ->and(Nota::where('turma_id', $turma->id_turma)->where('usuario_id', $aluno->id)->where('periodo_letivo', '2º Trimestre')->count())->toBe(2)
        // Matemática possui também 3º Trimestre (20.0)
        ->and(Nota::where('turma_id', $turma->id_turma)->where('usuario_id', $aluno->id)->where('periodo_letivo', '3º Trimestre')->count())->toBe(1)
        // A coluna TOTAL (53.12 ou 69.31) NÃO deve existir como nota
        ->and(Nota::where('turma_id', $turma->id_turma)->where('valor_nota', 53.12)->exists())->toBeFalse()
        ->and(Nota::where('turma_id', $turma->id_turma)->where('valor_nota', 69.31)->exists())->toBeFalse();
});

test('importacao de relatorio detecta divergencias em periodos anteriores e solicita confirmacao', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    $aluno = User::factory()->create([
        'name' => 'Carlos Eduardo Barros',
        'email' => 'carlos.barros@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $disciplina = Disciplina::factory()->create(['nome' => 'Física']);

    // Nota prévia já cadastrada no 1º Trimestre = 20.0
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 20.0,
    ]);

    // CSV novo informa 1º Trimestre = 25.0 (divergente!) e 2º Trimestre = 22.0 (novo)
    $csvContent = implode("\n", [
        'ALUNO,FÍSICA,,',
        ',1º TRIMESTRE,2º TRIMESTRE,FALTAS',
        'Carlos Eduardo Barros,25.0,22.0,2',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_com_divergencia.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'pendente_confirmacao')
        ->assertJsonPath('tipo_pendencia', 'divergencias_notas')
        ->assertJsonCount(1, 'divergencias')
        ->assertJsonPath('divergencias.0.periodo_letivo', '1º Trimestre');

    expect((float) $response->json('divergencias.0.nota_atual'))->toEqual(20.0)
        ->and((float) $response->json('divergencias.0.nova_nota'))->toEqual(25.0);

    // Nota no banco de dados não foi alterada antes da decisão do usuário
    $notaDb = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('periodo_letivo', '1º Trimestre')
        ->first();

    expect((float) $notaDb->valor_nota)->toEqual(20.0)
        // 2º trimestre não foi salvo ainda
        ->and(Nota::where('turma_id', $turma->id_turma)->where('periodo_letivo', '2º Trimestre')->exists())->toBeFalse();
});

test('especialista confirma atualizacao de notas divergentes de periodos anteriores', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    $aluno = User::factory()->create([
        'name' => 'Carlos Eduardo Barros',
        'email' => 'carlos.barros@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $disciplina = Disciplina::factory()->create(['nome' => 'Física']);

    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 20.0,
    ]);

    $csvContent = implode("\n", [
        'ALUNO,FÍSICA,,',
        ',1º TRIMESTRE,2º TRIMESTRE,FALTAS',
        'Carlos Eduardo Barros,25.0,22.0,2',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_com_divergencia.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
        'decisao_divergencias' => 'atualizar',
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'sucesso');

    // Nota do 1º Trimestre foi atualizada para 25.0 e o 2º Trimestre foi criado com 22.0
    $nota1 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('periodo_letivo', '1º Trimestre')
        ->first();
    $nota2 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('periodo_letivo', '2º Trimestre')
        ->first();

    expect((float) $nota1->valor_nota)->toEqual(25.0)
        ->and((float) $nota2->valor_nota)->toEqual(22.0);
});

test('especialista opta por manter notas anteriores e importar apenas novos periodos', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    $aluno = User::factory()->create([
        'name' => 'Carlos Eduardo Barros',
        'email' => 'carlos.barros@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $disciplina = Disciplina::factory()->create(['nome' => 'Física']);

    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 20.0,
    ]);

    $csvContent = implode("\n", [
        'ALUNO,FÍSICA,,',
        ',1º TRIMESTRE,2º TRIMESTRE,FALTAS',
        'Carlos Eduardo Barros,25.0,22.0,2',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_com_divergencia.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
        'decisao_divergencias' => 'manter',
    ]);

    $response->assertOk()
        ->assertJsonPath('status', 'sucesso');

    // Nota do 1º Trimestre foi MANTIDA em 20.0 e o 2º Trimestre foi gravado normalmente com 22.0
    $nota1 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('periodo_letivo', '1º Trimestre')
        ->first();
    $nota2 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('periodo_letivo', '2º Trimestre')
        ->first();

    expect((float) $nota1->valor_nota)->toEqual(20.0)
        ->and((float) $nota2->valor_nota)->toEqual(22.0);
});

test('notas de periodos anteriores identicas sao sincronizadas sem interrupcao', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();

    $aluno = User::factory()->create([
        'name' => 'Carlos Eduardo Barros',
        'email' => 'carlos.barros@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
    ]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $disciplina = Disciplina::factory()->create(['nome' => 'Física']);

    // Nota prévia com o MESMO valor da planilha (25.0)
    Nota::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 25.0,
    ]);

    $csvContent = implode("\n", [
        'ALUNO,FÍSICA,,',
        ',1º TRIMESTRE,2º TRIMESTRE,FALTAS',
        'Carlos Eduardo Barros,25.0,22.0,2',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_sem_divergencia.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
    ]);

    // Como as notas são as mesmas, importa sem pendência de confirmação
    $response->assertOk()
        ->assertJsonPath('status', 'sucesso')
        ->assertJsonCount(0, 'divergencias');

    expect(Nota::where('turma_id', $turma->id_turma)->where('periodo_letivo', '2º Trimestre')->exists())->toBeTrue();
});

test('importacao de csv atribui valor_maximo de 30 para 1º e 2º trimestres e 40 para o 3º trimestre', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create(['status' => 'Ativa']);
    $aluno = User::factory()->create(['name' => 'Mariana Lima', 'role' => UserRole::ALUNO]);

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
        'status_matricula' => 'Ativo',
    ]);

    $disciplina = Disciplina::factory()->create(['nome' => 'História']);

    $csvContent = implode("\n", [
        'ALUNO,HISTÓRIA,,,',
        ',1º TRIMESTRE,2º TRIMESTRE,3º TRIMESTRE,FALTAS',
        'Mariana Lima,28.0,27.5,38.0,0',
    ]);

    $arquivoFake = UploadedFile::fake()->createWithContent('diario_trimestres_escala.csv', $csvContent);

    $response = $this->actingAs($especialista, 'sanctum')->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivoFake,
    ]);

    $response->assertOk();

    $nota1 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('disciplina_id', $disciplina->id_disciplina)
        ->where('periodo_letivo', '1º Trimestre')
        ->first();

    $nota2 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('disciplina_id', $disciplina->id_disciplina)
        ->where('periodo_letivo', '2º Trimestre')
        ->first();

    $nota3 = Nota::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->where('disciplina_id', $disciplina->id_disciplina)
        ->where('periodo_letivo', '3º Trimestre')
        ->first();

    expect((float) $nota1->valor_maximo)->toBe(30.0);
    expect((float) $nota2->valor_maximo)->toBe(30.0);
    expect((float) $nota3->valor_maximo)->toBe(40.0);
});
