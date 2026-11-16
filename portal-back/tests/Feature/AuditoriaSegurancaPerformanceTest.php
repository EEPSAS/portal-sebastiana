<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Evento;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

/**
 * AuditoriaSegurancaPerformanceTest - Testes de Regressão da Auditoria de Segurança e Performance
 *
 * Papel Didático:
 * Garante que todas as correções de segurança (remoção do módulo órfão Radioatividade,
 * bloqueio de listagem nominal de colegas para alunos, proteção contra IDOR em notas,
 * CORS restrito em produção) e de performance (escopos indexáveis em Evento e remoção
 * de escritas N+1 em rotas GET acadêmicas) permaneçam blindadas contra regressões.
 */
test('Modulo orfao Radioatividade permanece purgado do banco e da camada de rotas', function () {
    $adm = criarUsuarioComPapel(UserRole::ADM);
    Sanctum::actingAs($adm);

    expect(Schema::hasTable('radioatividades'))->toBeFalse();

    $this->getJson('/api/radioatividades')->assertNotFound();
    $this->postJson('/api/radioatividades', ['titulo' => 'Teste'])->assertNotFound();
});

test('Listagem nominal de alunos da turma bloqueia estudantes matriculados e professores nao vinculados', function () {
    $alunoMatriculado = criarUsuarioComPapel(UserRole::ALUNO);
    $professorVinculado = criarUsuarioComPapel(UserRole::PROFESSOR);
    $professorEstranho = criarUsuarioComPapel(UserRole::PROFESSOR);
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);

    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    Matricula::factory()->create([
        'usuario_id' => $alunoMatriculado->id,
        'turma_id' => $turma->id_turma,
        'status_matricula' => 'Ativo',
    ]);

    TurmaDisciplina::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professorVinculado->id,
    ]);

    // Aluno matriculado na turma recebe 403 ao tentar listar todos os colegas da turma
    Sanctum::actingAs($alunoMatriculado);
    $this->getJson("/api/turmas/{$turma->id_turma}/alunos")->assertForbidden();

    // Professor não vinculado à turma recebe 403 via TurmaPolicy::view
    Sanctum::actingAs($professorEstranho);
    $this->getJson("/api/turmas/{$turma->id_turma}/alunos")->assertForbidden();

    // Professor vinculado à turma e Especialista recebem 200 OK com a listagem nominal
    Sanctum::actingAs($professorVinculado);
    $this->getJson("/api/turmas/{$turma->id_turma}/alunos")
        ->assertOk()
        ->assertJsonFragment(['id' => $alunoMatriculado->id]);

    Sanctum::actingAs($especialista);
    $this->getJson("/api/turmas/{$turma->id_turma}/alunos")
        ->assertOk()
        ->assertJsonFragment(['id' => $alunoMatriculado->id]);
});

test('Consulta de notas da turma bloqueia IDOR de aluno tentando filtrar usuario_id de colega', function () {
    $alunoA = criarUsuarioComPapel(UserRole::ALUNO, ['email' => 'aluno.a@aluno.mg.gov.br']);
    $alunoB = criarUsuarioComPapel(UserRole::ALUNO, ['email' => 'aluno.b@aluno.mg.gov.br']);
    $professor = criarUsuarioComPapel(UserRole::PROFESSOR);

    $turma = Turma::factory()->create(['ano_letivo' => 2026]);
    $disciplina = Disciplina::factory()->create();

    foreach ([$alunoA, $alunoB] as $estudante) {
        Matricula::factory()->create([
            'usuario_id' => $estudante->id,
            'turma_id' => $turma->id_turma,
            'status_matricula' => 'Ativo',
        ]);
    }

    TurmaDisciplina::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professor->id,
    ]);

    Nota::factory()->create([
        'usuario_id' => $alunoA->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 18.5,
    ]);

    Nota::factory()->create([
        'usuario_id' => $alunoB->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 29.0,
    ]);

    // Aluno A tenta injetar ?usuario_id= do Aluno B, mas recebe apenas suas próprias notas
    Sanctum::actingAs($alunoA);
    $respostaAluno = $this->getJson("/api/turmas/{$turma->id_turma}/notas?usuario_id={$alunoB->id}")
        ->assertOk()
        ->json();

    expect($respostaAluno)->toHaveCount(1)
        ->and($respostaAluno[0]['usuario_id'])->toBe($alunoA->id);

    // Professor vinculado pode filtrar normalmente as notas do Aluno B
    Sanctum::actingAs($professor);
    $respostaProfessor = $this->getJson("/api/turmas/{$turma->id_turma}/notas?usuario_id={$alunoB->id}")
        ->assertOk()
        ->json();

    expect($respostaProfessor)->toHaveCount(1)
        ->and($respostaProfessor[0]['usuario_id'])->toBe($alunoB->id);
});

test('Configuracao CORS libera localhost em local ou testing e restringe ao FRONTEND_URL em producao', function () {
    $envAnterior = $_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? getenv('APP_ENV');
    $frontAnterior = $_SERVER['FRONTEND_URL'] ?? $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL');

    try {
        // Cenário 1: Ambiente testing/local mantém localhost:5173 e 127.0.0.1:5173 habilitados
        putenv('APP_ENV=testing');
        putenv('FRONTEND_URL=https://portal-sebastiana.up.railway.app/');
        $_ENV['APP_ENV'] = 'testing';
        $_SERVER['APP_ENV'] = 'testing';
        $_ENV['FRONTEND_URL'] = 'https://portal-sebastiana.up.railway.app/';
        $_SERVER['FRONTEND_URL'] = 'https://portal-sebastiana.up.railway.app/';

        $corsTesting = require base_path('config/cors.php');
        expect($corsTesting['allowed_origins'])->toContain(
            'https://portal-sebastiana.up.railway.app',
            'http://localhost:5173',
            'http://127.0.0.1:5173'
        );

        // Cenário 2: Ambiente production autoriza apenas o domínio oficial normalizado em FRONTEND_URL
        putenv('APP_ENV=production');
        putenv('FRONTEND_URL=portal-sebastiana.up.railway.app/');
        $_ENV['APP_ENV'] = 'production';
        $_SERVER['APP_ENV'] = 'production';
        $_ENV['FRONTEND_URL'] = 'portal-sebastiana.up.railway.app/';
        $_SERVER['FRONTEND_URL'] = 'portal-sebastiana.up.railway.app/';

        $corsProducao = require base_path('config/cors.php');
        expect($corsProducao['allowed_origins'])->toBe(['https://portal-sebastiana.up.railway.app']);
    } finally {
        // Restaura variáveis de ambiente originais do processo de teste
        if ($envAnterior !== false && $envAnterior !== null) {
            putenv("APP_ENV={$envAnterior}");
            $_ENV['APP_ENV'] = $envAnterior;
            $_SERVER['APP_ENV'] = $envAnterior;
        }
        if ($frontAnterior !== false && $frontAnterior !== null) {
            putenv("FRONTEND_URL={$frontAnterior}");
            $_ENV['FRONTEND_URL'] = $frontAnterior;
            $_SERVER['FRONTEND_URL'] = $frontAnterior;
        } else {
            putenv('FRONTEND_URL');
            unset($_ENV['FRONTEND_URL'], $_SERVER['FRONTEND_URL']);
        }
    }
});

test('Escopos porMesAno e porPeriodo do model Evento filtram intervalos exatos incluindo ano bissexto', function () {
    // Fevereiro de 2024 (ano bissexto -> dia 29 existe) vs Fevereiro de 2025 (não bissexto -> até dia 28)
    $eventoBissexto = Evento::factory()->create(['data_inicio' => '2024-02-29', 'data_fim' => '2024-02-29']);
    $eventoMar2024 = Evento::factory()->create(['data_inicio' => '2024-03-01', 'data_fim' => '2024-03-01']);
    $eventoFev2025 = Evento::factory()->create(['data_inicio' => '2025-02-28', 'data_fim' => '2025-02-28']);
    $eventoAbril30 = Evento::factory()->create(['data_inicio' => '2026-04-30', 'data_fim' => '2026-04-30']);
    $eventoDez31 = Evento::factory()->create(['data_inicio' => '2026-12-31', 'data_fim' => '2026-12-31']);

    $fev2024Ids = Evento::query()->porMesAno(2, 2024)->pluck('id')->all();
    expect($fev2024Ids)->toContain($eventoBissexto->id)
        ->not->toContain($eventoMar2024->id);

    $fev2025Ids = Evento::query()->porMesAno(2, 2025)->pluck('id')->all();
    expect($fev2025Ids)->toContain($eventoFev2025->id);

    // Meses de 30 e 31 dias e clampeamento defensivo de meses fora da faixa (0 -> Jan, 13 -> Dez)
    expect(Evento::query()->porMesAno(4, 2026)->pluck('id')->all())->toContain($eventoAbril30->id);
    expect(Evento::query()->porMesAno(13, 2026)->pluck('id')->all())->toContain($eventoDez31->id);

    // Escopo porPeriodo com início e fim explícitos
    $periodoIds = Evento::query()->porPeriodo('2024-02-01', '2024-02-29')->pluck('id')->all();
    expect($periodoIds)->toContain($eventoBissexto->id)
        ->not->toContain($eventoMar2024->id);
});

test('Rotas GET academicas filtram turmas do professor via Ciclo sem executar INSERT ou UPDATE N+1', function () {
    $professor = criarUsuarioComPapel(UserRole::PROFESSOR);
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);

    $ciclo = Ciclo::factory()->create(['nome' => 'Ensino Médio Integral']);
    $disciplina = Disciplina::factory()->create(['nome' => 'Física']);

    // Vincula a disciplina ao ciclo e o professor à disciplina (sem criar TurmaDisciplina prévia)
    $ciclo->disciplinas()->attach($disciplina->id_disciplina);
    $disciplina->professores()->attach($professor->id);

    $turma = Turma::factory()->create([
        'ciclo_id' => $ciclo->id_ciclo,
        'nome_identificador' => '1º Ano Z',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    Matricula::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'status_matricula' => 'Ativo',
    ]);

    Sanctum::actingAs($professor);

    $queriesEscrita = [];
    DB::listen(function ($query) use (&$queriesEscrita) {
        $sql = strtolower(trim($query->sql));
        if (str_starts_with($sql, 'insert') || str_starts_with($sql, 'update') || str_starts_with($sql, 'delete')) {
            $queriesEscrita[] = $query->sql;
        }
    });

    // Executa as 5 rotas GET que anteriormente disparavam sincronização N+1 em banco
    $this->getJson('/api/ciclos')->assertOk();
    $this->getJson('/api/matriculas')->assertOk()->assertJsonFragment(['turma_id' => $turma->id_turma]);
    $this->getJson('/api/turmas')->assertOk()->assertJsonFragment(['id_turma' => $turma->id_turma]);
    $this->getJson('/api/turmas/resumo-geral')->assertOk()->assertJsonFragment(['id_turma' => $turma->id_turma]);
    $this->getJson('/api/planos-estudos/turmas-lecionadas')->assertOk()->assertJsonFragment(['id_turma' => $turma->id_turma]);

    expect($queriesEscrita)->toBeEmpty();
});
