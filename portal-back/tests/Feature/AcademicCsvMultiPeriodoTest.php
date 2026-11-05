<?php

use App\Models\Ciclo;
use App\Models\Disciplina;
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
