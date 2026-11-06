<?php

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

beforeEach(function () {
    Storage::fake('local');
});

test('especialista importa com sucesso csv multi-periodo preservando notas e faltas das etapas', function () {
    $especialista = User::factory()->create([
        'role' => 'especialista',
        'email' => 'especialista.teste@educacao.mg.gov.br',
    ]);

    $aluno1 = User::factory()->create([
        'role' => 'aluno',
        'name' => 'ANA RAMOS',
        'email' => 'ana.ramos@aluno.mg.gov.br',
    ]);

    $aluno2 = User::factory()->create([
        'role' => 'aluno',
        'name' => 'BRUNO COSTA',
        'email' => 'bruno.costa@aluno.mg.gov.br',
    ]);

    $disciplina = Disciplina::firstOrCreate(['nome' => 'Desenvolvimento de Sistemas']);

    $ciclo = Ciclo::create([
        'nome' => 'Ensino Médio Técnico',
        'descricao' => 'Ciclo de formação técnica',
    ]);

    $periodoLetivo = PeriodoLetivo::create([
        'ano' => 2026,
        'tipo_divisao' => 'trimestre',
        'total_pontos' => 100,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-12-15',
        'ativo' => true,
    ]);

    PeriodoLetivoDivisao::create([
        'periodo_letivo_id' => $periodoLetivo->id_periodo_letivo,
        'numero' => 1,
        'ordem' => 1,
        'nome' => '1º Trimestre',
        'pontos' => 30.00,
        'data_inicio' => '2026-02-01',
        'data_fim' => '2026-05-15',
    ]);

    PeriodoLetivoDivisao::create([
        'periodo_letivo_id' => $periodoLetivo->id_periodo_letivo,
        'numero' => 2,
        'ordem' => 2,
        'nome' => '2º Trimestre',
        'pontos' => 35.00,
        'data_inicio' => '2026-05-16',
        'data_fim' => '2026-08-31',
    ]);

    $turma = Turma::create([
        'nome_identificador' => '3º Ano - ADS',
        'ano_letivo' => 2026,
        'turno' => 'integral',
        'periodo_letivo_id' => $periodoLetivo->id_periodo_letivo,
        'ciclo_id' => $ciclo->id_ciclo,
        'ativo' => true,
    ]);

    $turma->alunos()->attach([
        $aluno1->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
        $aluno2->id => ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo'],
    ]);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    // CSV simulando cabeçalho multi-período oficial com disciplinas na linha superior e trimestres abaixo
    $csvContent = implode("\n", [
        'ESCOLA ESTADUAL PROFESSORA SEBASTIANA DE ALMEIDA E SILVA',
        'TURMA: 3º Ano - ADS - 2026',
        'ALUNO,Desenvolvimento de Sistemas,,Desenvolvimento de Sistemas,',
        ',1º Trimestre,FALTAS,2º Trimestre,FALTAS',
        'ANA RAMOS,25.5,2,30.0,4',
        'BRUNO COSTA,18.0,6,22.5,1',
    ]);

    $file = UploadedFile::fake()->createWithContent('relatorio_multi_periodo.csv', $csvContent);

    $response = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => $file,
        ]);

    $response->assertOk();

    // Consulta notas da turma e valida valor_maximo_periodo e taxa de faltas
    $responseNotas = $this->actingAs($especialista)
        ->getJson("/api/turmas/{$turma->id_turma}/notas");

    $responseNotas->assertOk();
    $notasData = $responseNotas->json();

    expect(count($notasData))->toBeGreaterThanOrEqual(2);

    $primeiraNota = $notasData[0];
    expect($primeiraNota)->toHaveKeys(['valor_maximo_periodo', 'percentual_faltas', 'total_faltas']);
});

test('bloqueia upload de arquivo com payload executavel ou script', function () {
    $especialista = User::factory()->create([
        'role' => 'especialista',
    ]);

    $turma = Turma::factory()->create();

    $csvMalicioso = "Aluno;Disciplina;Nota\n<script>alert('xss')</script>;Matemática;10";
    $file = UploadedFile::fake()->createWithContent('malicious.csv', $csvMalicioso);

    $response = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => $file,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['arquivo']);
});

test('endpoint de resumo-geral retorna ciclo_id e ciclo_nome de cada turma', function () {
    $especialista = User::factory()->create(['role' => 'especialista']);
    $ciclo = Ciclo::create(['nome' => 'Ensino Fundamental II']);
    $turma = Turma::factory()->create(['ciclo_id' => $ciclo->id_ciclo]);

    $response = $this->actingAs($especialista)->getJson('/api/turmas/resumo-geral');

    $response->assertOk();
    $dados = $response->json();

    $turmaRetornada = collect($dados)->firstWhere('id_turma', $turma->id_turma);
    expect($turmaRetornada)->not->toBeNull();
    expect($turmaRetornada['ciclo_nome'])->toBe('Ensino Fundamental II');
});

test('especialista exclui dados do csv de todos os periodos removendo notas e frequencias', function () {
    $especialista = User::factory()->create(['role' => 'especialista']);
    $aluno = User::factory()->create(['role' => 'aluno', 'email' => 'aluno1@aluno.mg.gov.br']);
    $disciplina = Disciplina::firstOrCreate(['nome' => 'História']);
    $turma = Turma::factory()->create();
    $turma->alunos()->attach($aluno->id, ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);

    // Cria notas em períodos distintos
    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 25.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-03-01',
    ]);
    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '2º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 28.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-06-01',
    ]);

    // Cria faltas em períodos distintos
    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-10',
        'quantidade_aulas' => 2,
        'status_presenca' => 'Falta',
    ]);
    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-06-15',
        'quantidade_aulas' => 3,
        'status_presenca' => 'Falta',
    ]);

    // Exclusão com parametro 'todos' deve apagar todas as notas e faltas da turma
    $response = $this->actingAs($especialista)
        ->deleteJson("/api/turmas/{$turma->id_turma}/dados-csv?periodo_letivo=todos");

    $response->assertOk()
        ->assertJson([
            'notas_removidas' => 2,
            'frequencias_removidas' => 2,
        ]);

    expect(Nota::where('turma_id', $turma->id_turma)->count())->toBe(0);
    expect(Frequencia::where('turma_id', $turma->id_turma)->count())->toBe(0);
});

test('especialista exclui dados do csv filtrando por periodo especifico', function () {
    $especialista = User::factory()->create(['role' => 'especialista']);
    $aluno = User::factory()->create(['role' => 'aluno', 'email' => 'aluno2@aluno.mg.gov.br']);
    $disciplina = Disciplina::firstOrCreate(['nome' => 'Geografia']);
    $turma = Turma::factory()->create();
    $turma->alunos()->attach($aluno->id, ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);

    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 20.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-03-01',
    ]);
    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '2º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 22.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-06-01',
    ]);

    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-03-10',
        'quantidade_aulas' => 2,
        'status_presenca' => 'Falta',
    ]);
    Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-06-15',
        'quantidade_aulas' => 3,
        'status_presenca' => 'Falta',
    ]);

    // Exclusão filtrando apenas '1º Trimestre'
    $response = $this->actingAs($especialista)
        ->deleteJson("/api/turmas/{$turma->id_turma}/dados-csv?periodo_letivo=1º Trimestre");

    $response->assertOk()
        ->assertJson([
            'notas_removidas' => 1,
            'frequencias_removidas' => 1,
        ]);

    // O 2º Trimestre deve ser preservado
    expect(Nota::where('turma_id', $turma->id_turma)->where('periodo_letivo', '2º Trimestre')->count())->toBe(1);
    expect(Frequencia::where('turma_id', $turma->id_turma)->whereMonth('data_aula', '>=', 5)->count())->toBe(1);
});

test('especialista importa csv com coluna unica de faltas acumuladas distribuindo entre os trimestres avaliados', function () {
    $especialista = User::factory()->create(['role' => 'especialista']);
    $aluno = User::factory()->create([
        'role' => 'aluno',
        'name' => 'CAMILA DIAS',
        'email' => 'camila.dias@aluno.mg.gov.br',
    ]);
    $disciplina = Disciplina::firstOrCreate(['nome' => 'Filosofia']);
    $turma = Turma::factory()->create();
    $turma->alunos()->attach($aluno->id, ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    // CSV onde há 3 trimestres de notas e uma única coluna 'FALTAS' no final da matéria
    $csvContent = implode("\n", [
        'ESCOLA ESTADUAL PROFESSORA SEBASTIANA DE ALMEIDA E SILVA',
        'TURMA: 3º Ano - ADS - 2026',
        'ALUNO,Filosofia,,,',
        ',1º Trimestre,2º Trimestre,3º Trimestre,FALTAS',
        'CAMILA DIAS,22.0,24.0,26.0,6',
    ]);

    $file = UploadedFile::fake()->createWithContent('relatorio_faltas_acumuladas.csv', $csvContent);

    $response = $this->actingAs($especialista)
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => $file,
        ]);

    $response->assertOk();

    // As 6 faltas devem ter sido distribuídas entre os 3 trimestres avaliados (2 faltas em cada)
    $faltas = Frequencia::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno->id)
        ->get();

    expect($faltas->count())->toBe(3);
    expect($faltas->sum('quantidade_aulas'))->toBe(6);

    // Consulta boletim do 1º Trimestre para certificar que as faltas aparecem nele
    $responseBoletim = $this->actingAs($aluno)
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/boletim?trimestre=1");

    $responseBoletim->assertOk();
    $boletimData = $responseBoletim->json();
    $filosofiaBoletim = collect($boletimData['boletim'])->firstWhere('disciplina_id', $disciplina->id_disciplina);

    expect($filosofiaBoletim)->not->toBeNull();
    expect($filosofiaBoletim['somatorio_faltas'])->toBe(2);
    expect($filosofiaBoletim['total_aulas'])->toBeGreaterThanOrEqual(20);
});

test('aluno consulta boletim com zero faltas e recebe presenca de 100% com carga horaria projetada', function () {
    $aluno = User::factory()->create([
        'role' => 'aluno',
        'email' => 'aluno.presente@aluno.mg.gov.br',
    ]);
    $disciplina = Disciplina::firstOrCreate([
        'nome' => 'Sociologia',
        'carga_horaria_anual' => 80,
    ]);
    $turma = Turma::factory()->create();
    $turma->alunos()->attach($aluno->id, ['data_matricula' => '2026-02-01', 'status_matricula' => 'Ativo']);
    $turma->disciplinas()->attach($disciplina->id_disciplina);

    // Aluno possui nota no 1º Trimestre e nenhuma falta registrada
    Nota::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'tipo_avaliacao' => 'Diário Consolidado',
        'valor_nota' => 28.0,
        'valor_maximo' => 30.0,
        'data_registro' => '2026-03-01',
    ]);

    $response = $this->actingAs($aluno)
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/boletim?trimestre=1");

    $response->assertOk();
    $dados = $response->json();
    $sociologia = collect($dados['boletim'])->firstWhere('disciplina_id', $disciplina->id_disciplina);

    expect($sociologia['somatorio_faltas'])->toBe(0);
    // A carga projetada deve ser 80 / 3 = 27 aulas
    expect($sociologia['total_aulas'])->toBe(27);

    // Consulta comparativo global
    $responseComparativo = $this->actingAs($aluno)
        ->getJson("/api/alunos/{$aluno->id}/turmas/{$turma->id_turma}/comparativo-turma");

    $responseComparativo->assertOk();
    $compData = $responseComparativo->json();
    expect((float) $compData['frequencia_aluno_global'])->toEqual(100.0);
});
