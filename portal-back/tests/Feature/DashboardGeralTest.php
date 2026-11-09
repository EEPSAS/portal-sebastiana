<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Nota;
use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use App\Models\Turma;
use App\Models\User;
use App\Notifications\NotificacaoPortal;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('especialista pode acessar /api/dashboard/geral com dados consolidados reais', function () {
    $especialista = User::where('email', 'clara.mendes@sebastiana.edu.br')->first();

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertOk()
        ->assertJsonStructure([
            'kpis' => [
                'total_alunos',
                'media_geral',
                'frequencia_media',
                'noticias_publicadas',
                'total_turmas',
            ],
            'resumo_turmas' => [
                'medias' => [
                    '*' => ['id', 'turma', 'nota'],
                ],
                'frequencias' => [
                    '*' => ['id', 'turma', 'percentual'],
                ],
            ],
            'ultimas_notificacoes',
        ]);

    expect($response->json('kpis.total_alunos'))->toBeGreaterThanOrEqual(1)
        ->and($response->json('kpis.total_turmas'))->toBeGreaterThanOrEqual(1)
        ->and($response->json('resumo_turmas.medias'))->not->toBeEmpty();
});

test('professor pode acessar /api/dashboard/geral com dados de suas turmas lecionadas', function () {
    $professor = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();

    $response = $this->actingAs($professor, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertOk()
        ->assertJsonStructure([
            'kpis' => [
                'total_alunos',
                'media_geral',
                'frequencia_media',
                'noticias_publicadas',
                'total_turmas',
            ],
            'resumo_turmas' => [
                'medias',
                'frequencias',
            ],
            'ultimas_notificacoes',
        ]);

    expect($response->json('kpis.total_turmas'))->toBeGreaterThanOrEqual(1);
});

test('aluno comum nao pode acessar /api/dashboard/geral recebendo erro 403', function () {
    $aluno = User::where('email', 'yasmin.teixeira@aluno.mg.gov.br')->first();

    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertForbidden();
});

test('requisicao nao autenticada em /api/dashboard/geral retorna 401', function () {
    $response = $this->getJson('/api/dashboard/geral');

    $response->assertUnauthorized();
});

test('especialista filtra indicadores pela etapa e soma pontos apenas das etapas encerradas', function () {
    $this->travelTo(Carbon::parse('2040-11-05 12:00:00'));
    PeriodoLetivo::query()->update(['ativo' => false]);

    $periodo = PeriodoLetivo::factory()->ativo()->create([
        'ano' => 2040,
        'data_inicio' => '2040-02-05',
        'data_fim' => '2040-12-18',
    ]);

    foreach ([
        ['1º Trimestre', 30, '2040-02-05', '2040-04-30', 1],
        ['2º Trimestre', 30, '2040-05-02', '2040-08-31', 2],
        ['3º Trimestre', 40, '2040-09-01', '2040-12-18', 3],
    ] as [$nome, $pontos, $inicio, $fim, $numero]) {
        PeriodoLetivoDivisao::create([
            'periodo_letivo_id' => $periodo->id_periodo_letivo,
            'numero' => $numero,
            'nome' => $nome,
            'pontos' => $pontos,
            'data_inicio' => $inicio,
            'data_fim' => $fim,
            'ordem' => $numero,
        ]);
    }

    $turmaComNotasAltas = Turma::factory()->create(['ano_letivo' => 2040]);
    $turmaComNotasBaixas = Turma::factory()->create(['ano_letivo' => 2040]);
    $disciplina = Disciplina::factory()->create();
    $aluno = User::factory()->aluno()->create();

    Nota::factory()->create([
        'turma_id' => $turmaComNotasAltas->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 10,
    ]);
    foreach ([1, 2, 3] as $indice) {
        Nota::factory()->create([
            'turma_id' => $turmaComNotasBaixas->id_turma,
            'disciplina_id' => $disciplina->id_disciplina,
            'usuario_id' => $aluno->id,
            'periodo_letivo' => '1º Trimestre',
            'valor_nota' => 0,
            'tipo_avaliacao' => "Atividade {$indice}",
        ]);
    }
    Nota::factory()->create([
        'turma_id' => $turmaComNotasAltas->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '3º Trimestre',
        'valor_nota' => 8,
    ]);

    Frequencia::factory()->create([
        'turma_id' => $turmaComNotasAltas->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2040-03-10',
        'quantidade_aulas' => 2,
        'status_presenca' => 'Presente',
    ]);
    Frequencia::factory()->create([
        'turma_id' => $turmaComNotasBaixas->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2040-03-10',
        'quantidade_aulas' => 8,
        'status_presenca' => 'Falta',
    ]);
    Frequencia::factory()->create([
        'turma_id' => $turmaComNotasAltas->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2040-10-10',
        'quantidade_aulas' => 1,
        'status_presenca' => 'Presente',
    ]);

    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/dashboard/geral?divisao=1%C2%BA%20Trimestre');

    $response->assertOk()
        ->assertJsonPath('kpis.media_geral', 5)
        ->assertJsonPath('kpis.frequencia_media', '50%')
        ->assertJsonPath('periodo_contexto.pontos_consolidados', 60)
        ->assertJsonCount(2, 'resumo_turmas.medias')
        ->assertJsonCount(2, 'resumo_turmas.frequencias');
});

test('feed do painel retorna notificacoes unicas de autores permitidos e destinadas a bibliotecarias', function () {
    $professor = User::factory()->professor()->create(['name' => 'Professor Feed']);
    $aluno1 = User::factory()->aluno()->create();
    $aluno2 = User::factory()->aluno()->create();
    $bibliotecaria = User::factory()->create(['role' => UserRole::BIBLIOTECARIA]);
    $outroAluno = User::factory()->aluno()->create();

    $dadosManuais = [
        'titulo' => 'Aviso de aula',
        'assunto' => 'Mensagem enviada aos estudantes.',
        'tipo' => 'manual',
        'origem' => 'usuario',
        'prioridade' => 'importante',
        'criador_id' => $professor->id,
        'criador_nome' => $professor->name,
        'event_key' => 'manual:feed-professor',
    ];
    $aluno1->notify(new NotificacaoPortal($dadosManuais));
    $aluno2->notify(new NotificacaoPortal($dadosManuais));
    $bibliotecaria->notify(new NotificacaoPortal([
        ...$dadosManuais,
        'titulo' => 'Aviso à biblioteca',
        'event_key' => 'manual:feed-bibliotecaria-destino',
    ]));
    $bibliotecaria->notify(new NotificacaoPortal([
        'titulo' => 'Alerta automático',
        'assunto' => 'Notificação do sistema para a biblioteca.',
        'tipo' => 'frequencia_risco',
        'origem' => 'sistema',
        'prioridade' => 'padrao',
        'criador_id' => null,
        'criador_nome' => 'Sistema',
        'event_key' => 'sistema:feed-bibliotecaria',
    ]));
    $outroAluno->notify(new NotificacaoPortal([
        ...$dadosManuais,
        'titulo' => 'Aviso de aluno',
        'criador_id' => $outroAluno->id,
        'criador_nome' => $outroAluno->name,
        'event_key' => 'manual:feed-aluno',
    ]));

    $especialista = User::factory()->especialista()->create();
    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertOk()
        ->assertJsonCount(3, 'ultimas_notificacoes')
        ->assertJsonFragment(['texto' => 'Professor Feed: Aviso de aula'])
        ->assertJsonFragment(['texto' => 'Sistema: Alerta automático'])
        ->assertJsonMissing(['texto' => "{$outroAluno->name}: Aviso de aluno"]);
});

test('professor sem disciplinas vinculadas recebe lista vazia sem dados ficticios e especialista recebe modo simulacao', function () {
    $profSemAlocacao = User::factory()->professor()->create(['name' => 'Docente Novo']);

    $respProf = $this->actingAs($profSemAlocacao, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $respProf->assertOk()
        ->assertJsonPath('kpis.total_turmas', 0)
        ->assertJsonPath('kpis.total_alunos', 0)
        ->assertJsonCount(0, 'disciplinas_docente')
        ->assertJsonCount(0, 'disciplinas_detalhadas');

    // Já o Administrador/Especialista enxerga as disciplinas reais da escola sinalizadas com modo_simulacao = true
    $adm = User::factory()->create(['role' => UserRole::ADM]);
    $respAdm = $this->actingAs($adm, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $respAdm->assertOk();
    expect($respAdm->json('disciplinas_detalhadas'))->not->toBeEmpty()
        ->and($respAdm->json('disciplinas_detalhadas.0.modo_simulacao'))->toBeTrue()
        ->and($respAdm->json('disciplinas_detalhadas.0'))->toHaveKeys(['medias', 'frequencias', 'risco']);
});
