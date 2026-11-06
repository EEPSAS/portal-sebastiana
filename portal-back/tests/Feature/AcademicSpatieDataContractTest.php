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
            'catalogo_ciclos',
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
