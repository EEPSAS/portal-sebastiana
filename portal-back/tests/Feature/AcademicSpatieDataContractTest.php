<?php

use App\Data\Academico\SalvarTurmaData;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Nota;
use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Suíte de testes de conformidade de contratos com Spatie Laravel Data (Módulo Acadêmico).
 * Garante validação estrita de filtros/inputs e paridade 1:1 com os Schemas Zod do frontend.
 */
test('rejeita filtros invalidos na rota de notas da turma via FiltroNotasTurmaData', function () {
    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.spatie@educacao.mg.gov.br',
    ]);

    $turma = Turma::create([
        'nome_identificador' => '1º Ano A',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
        'status' => 'Ativa',
    ]);

    // Envia texto não numérico em disciplina_id e zero em aluno_id -> deve retornar 422 Unprocessable Entity
    $response = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?disciplina_id=invalido&aluno_id=0");

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['disciplina_id', 'aluno_id']);
});

test('rejeita payload invalido em SalvarTurmaData quando turno ou ano letivo violam contrato', function () {
    PeriodoLetivo::create([
        'ano' => 2026,
        'tipo_divisao' => 'trimestre',
        'total_pontos' => 100,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-12-15',
        'ativo' => true,
    ]);

    expect(fn () => SalvarTurmaData::validateAndCreate([
        'nome_identificador' => 'Turma Teste',
        'turno' => 'Madrugada', // Fora do enum permitido
        'ano_letivo' => 2035,   // Sem Período Letivo correspondente
    ]))->toThrow(ValidationException::class);
});

test('garante paridade 1:1 dos contratos TurmaData, TurmaResumoData e NotaDiarioData nos endpoints HTTP', function () {
    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.contrato@educacao.mg.gov.br',
    ]);

    $aluno = User::factory()->create([
        'role' => 'aluno',
        'name' => 'ANA RAMOS',
        'email' => 'ana.ramos.contrato@aluno.mg.gov.br',
    ]);

    $ciclo = Ciclo::create([
        'nome' => '3º Ano - Ensino Médio',
        'descricao' => 'Ciclo concluinte do ensino médio técnico.',
    ]);

    $disciplina = Disciplina::create([
        'nome' => 'Desenvolvimento de Aplicativos',
        'carga_horaria_anual' => 80,
        'aulas_semanais' => 2,
    ]);
    $ciclo->disciplinas()->attach($disciplina->id_disciplina);

    $periodo = PeriodoLetivo::create([
        'ano' => 2026,
        'tipo_divisao' => 'trimestre',
        'total_pontos' => 100,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-12-15',
        'ativo' => true,
    ]);

    PeriodoLetivoDivisao::create([
        'periodo_letivo_id' => $periodo->id_periodo_letivo,
        'numero' => 1,
        'ordem' => 1,
        'nome' => '1º Trimestre',
        'pontos' => 30.00,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-05-15',
    ]);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano - ADS',
        'ciclo_id' => $ciclo->id_ciclo,
        'periodo_letivo_id' => $periodo->id_periodo_letivo,
        'ano_letivo' => 2026,
        'turno' => 'Integral',
        'capacidade_maxima' => 40,
        'status' => 'Ativa',
    ]);

    $turma->alunos()->attach($aluno->id, [
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'tipo_avaliacao' => 'Consolidado CSV',
        'valor_nota' => 25.5,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-05-10',
    ]);

    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-10',
        'quantidade_aulas' => 18,
        'status_presenca' => 'Presente',
    ]);

    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-17',
        'quantidade_aulas' => 2,
        'status_presenca' => 'Falta',
    ]);

    // 1. Verifica contrato de GET /api/turmas (TurmaData)
    $resTurmas = $this->actingAs($especialista)->getJson('/api/turmas');
    $resTurmas->assertOk()
        ->assertJsonFragment([
            'id_turma' => $turma->id_turma,
            'nome_identificador' => '3º Ano - ADS',
            'ciclo_id' => $ciclo->id_ciclo,
            'ciclo_nome' => '3º Ano - Ensino Médio',
            'periodo_letivo_id' => $periodo->id_periodo_letivo,
            'ano_letivo' => 2026,
            'turno' => 'Integral',
            'status' => 'Ativa',
        ]);

    // 2. Verifica contrato de GET /api/turmas/resumo-geral (TurmaResumoData)
    $resResumo = $this->actingAs($especialista)->getJson('/api/turmas/resumo-geral');
    $resResumo->assertOk();
    $itemResumo = collect($resResumo->json())->firstWhere('id_turma', $turma->id_turma);
    expect($itemResumo)->not->toBeNull()
        ->and($itemResumo['nome_identificador'])->toBe('3º Ano - ADS')
        ->and($itemResumo['taxa_absenteismo'])->toBeNumeric()->toEqual(10.0)
        ->and($itemResumo['taxa_presenca'])->toBeNumeric()->toEqual(90.0)
        ->and($itemResumo['distribuicao'])->toHaveKeys(['acima', 'na_media', 'abaixo']);

    // 3. Verifica contrato de GET /api/turmas/{turma}/notas (NotaDiarioData)
    $resNotas = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?periodo_letivo=".urlencode('1º Trimestre'));
    $resNotas->assertOk();
    $itemNota = $resNotas->json()[0] ?? null;
    expect($itemNota)->not->toBeNull()
        ->and($itemNota['valor_nota'])->toEqual(25.5)
        ->and($itemNota['valor_maximo_periodo'])->toEqual(30.0)
        ->and($itemNota['percentual_faltas'])->toEqual(10.0)
        ->and($itemNota['total_faltas'])->toBe(2)
        ->and($itemNota['situacao'])->toBe('Acima da Média')
        ->and($itemNota['aluno'])->toHaveKeys(['id', 'name', 'email'])
        ->and($itemNota['disciplina'])->toHaveKeys(['id_disciplina', 'nome']);
});

test('RegistroNotaCsvData descarta celulas invalidas com alerta detalhado e RelatorioImportadoData garante envelope 1:1', function () {
    Storage::fake('local');

    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.csv.dto@educacao.mg.gov.br',
    ]);

    $alunoValido = User::factory()->create([
        'role' => 'aluno',
        'name' => 'ANA RAMOS',
        'email' => 'ana.csv.dto@aluno.mg.gov.br',
    ]);

    $alunoAcima = User::factory()->create([
        'role' => 'aluno',
        'name' => 'BRUNO SILVA',
        'email' => 'bruno.csv.dto@aluno.mg.gov.br',
    ]);

    $alunoNegativo = User::factory()->create([
        'role' => 'aluno',
        'name' => 'CARLA SOUZA',
        'email' => 'carla.csv.dto@aluno.mg.gov.br',
    ]);

    $alunoTexto = User::factory()->create([
        'role' => 'aluno',
        'name' => 'DIEGO LIMA',
        'email' => 'diego.csv.dto@aluno.mg.gov.br',
    ]);

    $disciplina = Disciplina::create([
        'nome' => 'Banco de Dados',
        'carga_horaria_anual' => 80,
        'aulas_semanais' => 2,
    ]);

    $turma = Turma::create([
        'nome_identificador' => '2º Ano - DS',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
        'status' => 'Ativa',
    ]);

    $turma->alunos()->attach([
        $alunoValido->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
        $alunoAcima->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
        $alunoNegativo->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
        $alunoTexto->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
    ]);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    // ANA RAMOS tem nota 25.0 válida e falta fracionada 2.5 inválida; demais têm notas fora do contrato (150.0, -4.0 e DEZ)
    $csvContent = implode("\n", [
        'ESCOLA ESTADUAL PROFESSORA SEBASTIANA DE ALMEIDA E SILVA',
        'ALUNO,Banco de Dados,',
        ',1º Trimestre,FALTAS',
        'ANA RAMOS,25.0,2.5',
        'BRUNO SILVA,150.0,1',
        'CARLA SOUZA,-4.0,0',
        'DIEGO LIMA,DEZ,2',
    ]);

    $arquivo = UploadedFile::fake()->createWithContent('notas_validacao_celulas.csv', $csvContent);

    $response = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => $arquivo,
        ]);

    $response->assertOk()
        ->assertJsonStructure([
            'status',
            'tipo_pendencia',
            'message',
            'turma' => ['id_turma', 'nome_identificador'],
            'ambiguidades',
            'divergencias',
            'disciplinas_pendentes',
            'catalogo_disciplinas',
            'dados' => [
                'status',
                'tipo_pendencia',
                'message',
                'linhas_lidas',
                'periodo_aplicado',
                'data_referencia',
                'alunos_identificados',
                'alunos_ignorados',
                'total_ignorados',
                'notas_sincronizadas',
                'frequencias_sincronizadas',
                'alertas',
            ],
        ]);

    expect($response->json('status'))->toBe('sucesso')
        ->and($response->json('dados.notas_sincronizadas'))->toBe(1)
        ->and(Nota::where('turma_id', $turma->id_turma)->count())->toBe(1)
        ->and((float) Nota::where('usuario_id', $alunoValido->id)->value('valor_nota'))->toEqual(25.0);

    $alertasTexto = implode(' | ', $response->json('dados.alertas'));
    expect($alertasTexto)
        ->toContain('ANA RAMOS')
        ->toContain('2.5')
        ->toContain('BRUNO SILVA')
        ->toContain('150.0')
        ->toContain('CARLA SOUZA')
        ->toContain('-4.0')
        ->toContain('DIEGO LIMA')
        ->toContain('DEZ');
});

test('ImportarRelatorioInputData valida mapeamentos_disciplinas e padroniza sugestao_disciplina_id no envelope', function () {
    Storage::fake('local');

    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.conciliacao.dto@educacao.mg.gov.br',
    ]);

    $aluno = User::factory()->create([
        'role' => 'aluno',
        'name' => 'LUCAS MENDES',
        'email' => 'lucas.conciliacao@aluno.mg.gov.br',
    ]);

    $ciclo = Ciclo::create([
        'nome' => '3º Ano - Técnico',
        'descricao' => 'Ciclo com conciliação obrigatória',
    ]);

    $disciplinaCatalogo = Disciplina::create([
        'nome' => 'Programação Web',
        'carga_horaria_anual' => 120,
        'aulas_semanais' => 3,
    ]);
    $ciclo->disciplinas()->attach($disciplinaCatalogo->id_disciplina);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano - Web',
        'ciclo_id' => $ciclo->id_ciclo,
        'ano_letivo' => 2026,
        'turno' => 'Integral',
        'status' => 'Ativa',
    ]);
    $turma->alunos()->attach($aluno->id, [
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);
    // Vincula previamente a disciplina à turma (o importador CSV não cria vínculos automaticamente)
    $turma->disciplinas()->attach($disciplinaCatalogo->id_disciplina);

    // Nome aproximado "Programacao Web I" força etapa de conciliação e sugestão aproximada
    $csvContent = implode("\n", [
        'ALUNO,Programacao Web I,',
        ',1º Trimestre,FALTAS',
        'LUCAS MENDES,27.0,2',
    ]);

    // 1. Primeira tentativa sem mapeamento -> exige conciliação com chaves canônicas sugestao_disciplina_id/nome
    $resPendente = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('conciliacao_1.csv', $csvContent),
        ]);

    $resPendente->assertOk();
    expect($resPendente->json('status'))->toBe('pendente_confirmacao')
        ->and($resPendente->json('tipo_pendencia'))->toBe('conciliacao_disciplinas');
    $pendente = $resPendente->json('disciplinas_pendentes.0');
    expect($pendente)->toHaveKeys(['nome_csv', 'sugestao_disciplina_id', 'sugestao_disciplina_nome'])
        ->and($pendente['nome_csv'])->toBe('Programacao Web I')
        ->and($pendente['sugestao_disciplina_id'])->toBe($disciplinaCatalogo->id_disciplina)
        ->and($pendente['sugestao_disciplina_nome'])->toBe('Programação Web');

    // 2. Envia acao = 'vincular' sem disciplina_id -> deve retornar 422 via ImportarRelatorioInputData
    $resInvalido = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('conciliacao_2.csv', $csvContent),
            'mapeamentos_disciplinas' => json_encode([
                'Programacao Web I' => [
                    'acao' => 'vincular',
                ],
            ]),
        ]);

    $resInvalido->assertStatus(422)
        ->assertJsonValidationErrors(['mapeamentos_disciplinas.Programacao Web I.disciplina_id']);

    // 3. Envia disciplina_id canônico válido -> sincroniza com sucesso
    $resSucesso = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('conciliacao_3.csv', $csvContent),
            'mapeamentos_disciplinas' => json_encode([
                'Programacao Web I' => [
                    'acao' => 'vincular',
                    'disciplina_id' => $disciplinaCatalogo->id_disciplina,
                ],
            ]),
        ]);

    $resSucesso->assertOk();
    expect($resSucesso->json('status'))->toBe('sucesso')
        ->and($resSucesso->json('dados.notas_sincronizadas'))->toBe(1);
});

test('BoletimAlunoData e ComparativoTurmaData garantem paridade 1:1 com BoletimAlunoSchema e ComparativoTurmaSchema', function () {
    $turma = Turma::create([
        'nome_identificador' => '1º Ano - B',
        'ano_letivo' => 2026,
        'turno' => 'Vespertino',
        'status' => 'Ativa',
    ]);

    $aluno = User::factory()->create([
        'role' => 'aluno',
        'name' => 'MARIANA ALVES',
        'email' => 'mariana.boletim.dto@aluno.mg.gov.br',
    ]);

    $colega = User::factory()->create([
        'role' => 'aluno',
        'name' => 'PEDRO ROCHA',
        'email' => 'pedro.boletim.dto@aluno.mg.gov.br',
    ]);

    $turma->alunos()->attach([
        $aluno->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
        $colega->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
    ]);

    $disciplina = Disciplina::create([
        'nome' => 'Química',
        'carga_horaria_anual' => 80,
        'aulas_semanais' => 2,
    ]);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 24.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-05-10',
    ]);

    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $colega->id,
        'periodo_letivo' => '1º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 18.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-05-10',
    ]);

    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-04-10',
        'quantidade_aulas' => 19,
        'status_presenca' => 'Presente',
    ]);

    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-04-11',
        'quantidade_aulas' => 1,
        'status_presenca' => 'Falta',
    ]);

    // 1. Valida BoletimResource -> BoletimAlunoData
    $resBoletim = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/boletim?trimestre=1");

    $resBoletim->assertOk()
        ->assertJsonStructure([
            'turma_id',
            'aluno_id',
            'periodo_selecionado',
            'boletim' => [
                '*' => [
                    'disciplina_id',
                    'nome_disciplina',
                    'nota_obtida',
                    'valor_maximo',
                    'somatorio_faltas',
                    'total_aulas',
                    'status',
                    'id',
                    'materia',
                    'pontos',
                    'cor',
                ],
            ],
            'grafico_boletim' => [
                '*' => ['id', 'materia', 'pontos', 'cor'],
            ],
        ]);

    expect($resBoletim->json('turma_id'))->toBe($turma->id_turma)
        ->and($resBoletim->json('aluno_id'))->toBe($aluno->id)
        ->and($resBoletim->json('periodo_selecionado'))->toBe('1º Trimestre')
        ->and($resBoletim->json('boletim.0.nota_obtida'))->toEqual(24.0)
        ->and($resBoletim->json('boletim.0.valor_maximo'))->toEqual(30.0)
        ->and($resBoletim->json('boletim.0.somatorio_faltas'))->toBe(1)
        ->and($resBoletim->json('boletim.0.status'))->toBe('Aprovado');

    // 2. Valida ComparativoTurmaResource -> ComparativoTurmaData
    $resComparativo = $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/comparativo-turma?trimestre=1");

    $resComparativo->assertOk()
        ->assertJsonStructure([
            'turma_id',
            'aluno_id',
            'periodo_selecionado',
            'frequencia_aluno_global',
            'frequencia_turma_global',
            'comparativo' => [
                '*' => [
                    'disciplina_id',
                    'nome_disciplina',
                    'nota_aluno',
                    'faltas_aluno',
                    'frequencia_aluno',
                    'media_turma',
                    'media_faltas_turma',
                    'frequencia_turma',
                    'valor_maximo',
                ],
            ],
            'radar' => [
                'labels',
                'series' => [
                    '*' => ['name', 'data', 'faltas'],
                ],
            ],
        ]);

    expect($resComparativo->json('comparativo.0.nota_aluno'))->toEqual(24.0)
        ->and($resComparativo->json('comparativo.0.media_turma'))->toEqual(21.0)
        ->and($resComparativo->json('comparativo.0.valor_maximo'))->toEqual(30.0);
});

test('calcula faltas isoladas por periodo com denominador LDB, Risco por Falta (>25%) e taxa realista no velocimetro apos CSV multi-periodo', function () {
    Storage::fake('local');

    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.faltas.ldb@educacao.mg.gov.br',
    ]);

    $aluno = User::factory()->create([
        'role' => 'aluno',
        'name' => 'ANA RAMOS',
        'email' => 'ana.faltas.ldb@aluno.mg.gov.br',
    ]);

    $periodo = PeriodoLetivo::create([
        'ano' => 2026,
        'tipo_divisao' => 'trimestre',
        'total_pontos' => 100,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-12-15',
        'ativo' => true,
    ]);

    PeriodoLetivoDivisao::create([
        'periodo_letivo_id' => $periodo->id_periodo_letivo,
        'numero' => 1,
        'ordem' => 1,
        'nome' => '1º Trimestre',
        'pontos' => 30.00,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-05-15',
    ]);

    PeriodoLetivoDivisao::create([
        'periodo_letivo_id' => $periodo->id_periodo_letivo,
        'numero' => 2,
        'ordem' => 2,
        'nome' => '2º Trimestre',
        'pontos' => 30.00,
        'data_inicio' => '2026-05-16',
        'data_fim' => '2026-08-31',
    ]);

    PeriodoLetivoDivisao::create([
        'periodo_letivo_id' => $periodo->id_periodo_letivo,
        'numero' => 3,
        'ordem' => 3,
        'nome' => '3º Trimestre',
        'pontos' => 40.00,
        'data_inicio' => '2026-09-01',
        'data_fim' => '2026-12-15',
    ]);

    // 90h anuais / 3 divisões = 30 aulas previstas por trimestre
    $disciplina = Disciplina::create([
        'nome' => 'Matemática Aplicada',
        'carga_horaria_anual' => 90,
        'aulas_semanais' => 3,
    ]);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano - LDB',
        'periodo_letivo_id' => $periodo->id_periodo_letivo,
        'ano_letivo' => 2026,
        'turno' => 'Integral',
        'status' => 'Ativa',
    ]);

    $turma->alunos()->attach($aluno->id, [
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    // 1º Trimestre: nota 24.0, 3 faltas de 30 (10.0% -> Acima da Média)
    // 2º Trimestre: nota 25.0, 9 faltas de 30 (30.0% > 25% -> Risco por Falta)
    $csvContent = implode("\n", [
        'ESCOLA ESTADUAL PROFESSORA SEBASTIANA DE ALMEIDA E SILVA',
        'ALUNO,Matemática Aplicada,,,',
        ',1º Trimestre,FALTAS,2º Trimestre,FALTAS',
        'ANA RAMOS,24.0,3,25.0,9',
    ]);

    $resImport = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('multi_trimestre_faltas.csv', $csvContent),
        ]);

    $resImport->assertOk();
    expect($resImport->json('status'))->toBe('sucesso')
        ->and($resImport->json('dados.notas_sincronizadas'))->toBe(2)
        ->and($resImport->json('dados.frequencias_sincronizadas'))->toBe(2);

    // 1. Verifica filtro estrito do 1º Trimestre (não vaza as 9 faltas do 2º Trimestre!)
    $resNotasT1 = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?periodo_letivo=".urlencode('1º Trimestre'));
    $resNotasT1->assertOk();
    $notaT1 = $resNotasT1->json('0');

    expect($notaT1)->not->toBeNull()
        ->and($notaT1['total_faltas'])->toBe(3)
        ->and($notaT1['total_aulas_previstas'])->toBe(30)
        ->and($notaT1['percentual_faltas'])->toEqual(10.0)
        ->and($notaT1['situacao'])->toBe('Acima da Média')
        ->and($notaT1['disciplina']['carga_horaria_anual'])->toBe(90);

    // 2. Verifica filtro estrito do 2º Trimestre e regra LDB Art. 24 (> 25% -> Risco por Falta)
    $resNotasT2 = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?periodo_letivo=".urlencode('2º Trimestre'));
    $resNotasT2->assertOk();
    $notaT2 = $resNotasT2->json('0');

    expect($notaT2)->not->toBeNull()
        ->and($notaT2['total_faltas'])->toBe(9)
        ->and($notaT2['total_aulas_previstas'])->toBe(30)
        ->and($notaT2['percentual_faltas'])->toEqual(30.0)
        ->and($notaT2['situacao'])->toBe('Risco por Falta');

    // 3. Verifica que o Velocímetro (GET /api/turmas/resumo-geral) projeta LDB (12 / 60 = 20.0%, e não 100%!)
    $resResumo = $this->actingAs($especialista)->getJson('/api/turmas/resumo-geral');
    $resResumo->assertOk();
    $resumoTurma = collect($resResumo->json())->firstWhere('id_turma', $turma->id_turma);

    expect($resumoTurma)->not->toBeNull()
        ->and($resumoTurma['taxa_absenteismo'])->toEqual(20.0)
        ->and($resumoTurma['taxa_presenca'])->toEqual(80.0);
});

test('DivergenciaNotaCsvData detecta divergencia exclusiva de faltas e respeita decisao manter ou atualizar', function () {
    Storage::fake('local');

    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.div.faltas@educacao.mg.gov.br',
    ]);

    $aluno = User::factory()->create([
        'role' => 'aluno',
        'name' => 'CARLOS MENDES',
        'email' => 'carlos.div.faltas@aluno.mg.gov.br',
    ]);

    $disciplina = Disciplina::create([
        'nome' => 'Redes de Computadores',
        'carga_horaria_anual' => 120,
        'aulas_semanais' => 3,
    ]);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano - Redes',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
        'status' => 'Ativa',
    ]);

    $turma->alunos()->attach($aluno->id, [
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    // 1ª Importação: 1º Trimestre com nota 25.0 e 2 faltas
    $csvInicial = implode("\n", [
        'ALUNO,Redes de Computadores,',
        ',1º Trimestre,FALTAS',
        'CARLOS MENDES,25.0,2',
    ]);

    $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('t1_inicial.csv', $csvInicial),
        ])
        ->assertOk()
        ->assertJsonPath('status', 'sucesso');

    // 2ª Importação: 1º Trimestre mantém nota 25.0 mas altera faltas de 2 -> 7, e inclui 2º Trimestre (nota 26.0, 1 falta)
    $csvRetificado = implode("\n", [
        'ALUNO,Redes de Computadores,,,',
        ',1º Trimestre,FALTAS,2º Trimestre,FALTAS',
        'CARLOS MENDES,25.0,7,26.0,1',
    ]);

    $resPendente = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('t1_t2_retificado.csv', $csvRetificado),
        ]);

    $resPendente->assertOk();
    expect($resPendente->json('status'))->toBe('pendente_confirmacao')
        ->and($resPendente->json('tipo_pendencia'))->toBe('divergencias_notas')
        ->and($resPendente->json('divergencias.0.tipo_divergencia'))->toBe('falta')
        ->and($resPendente->json('divergencias.0.faltas_atuais'))->toBe(2)
        ->and($resPendente->json('divergencias.0.novas_faltas'))->toBe(7)
        ->and($resPendente->json('divergencias.0.nota_atual'))->toEqual(25.0)
        ->and($resPendente->json('divergencias.0.nova_nota'))->toEqual(25.0);

    // 3ª Tentativa com decisao_divergencias = 'manter' -> preserva 2 faltas no 1º Trimestre e importa o 2º Trimestre
    $resManter = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('t1_t2_manter.csv', $csvRetificado),
            'decisao_divergencias' => 'manter',
        ]);

    $resManter->assertOk()->assertJsonPath('status', 'sucesso');

    $notaT1Mantida = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?periodo_letivo=".urlencode('1º Trimestre'))
        ->json('0');
    $notaT2Importada = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?periodo_letivo=".urlencode('2º Trimestre'))
        ->json('0');

    expect($notaT1Mantida['total_faltas'])->toBe(2)
        ->and($notaT2Importada['total_faltas'])->toBe(1);

    // 4ª Tentativa com decisao_divergencias = 'atualizar' -> atualiza as faltas do 1º Trimestre para 7
    $resAtualizar = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => UploadedFile::fake()->createWithContent('t1_t2_atualizar.csv', $csvRetificado),
            'decisao_divergencias' => 'atualizar',
        ]);

    $resAtualizar->assertOk()->assertJsonPath('status', 'sucesso');

    $notaT1Atualizada = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas?periodo_letivo=".urlencode('1º Trimestre'))
        ->json('0');

    expect($notaT1Atualizada['total_faltas'])->toBe(7);
});
