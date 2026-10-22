<?php

// use App\Models\Atividade; (Fora de escopo)
use App\Models\Disciplina;
use App\Models\Livro;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('testa autenticacao com usuarios povoados', function () {
    // 1. Login como Admin
    $respAdmin = $this->postJson('/api/auth/login', [
        'email' => 'admin@sebastiana.edu.br',
        'password' => 'password',
    ]);
    $respAdmin->assertOk()
        ->assertJsonPath('user.role', 'adm')
        ->assertJsonStructure(['user', 'token', 'token_type']);

    $adminToken = $respAdmin->json('token');

    // 2. Consulta /api/user como Admin
    $this->withToken($adminToken)->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('email', 'admin@sebastiana.edu.br');

    // 3. Login como Professor
    $respProf = $this->postJson('/api/auth/login', [
        'email' => 'carlos.silva@sebastiana.edu.br',
        'password' => 'password',
    ]);
    $respProf->assertOk()
        ->assertJsonPath('user.role', 'professor');

    // 4. Login como Especialista
    $respEsp = $this->postJson('/api/auth/login', [
        'email' => 'clara.mendes@sebastiana.edu.br',
        'password' => 'password',
    ]);
    $respEsp->assertOk()
        ->assertJsonPath('user.role', 'especialista');

    // 5. Login como Aluna Yasmin
    $respAluna = $this->postJson('/api/auth/login', [
        'email' => 'yasmin.teixeira@aluno.mg.gov.br',
        'password' => 'password',
    ]);
    $respAluna->assertOk()
        ->assertJsonPath('user.role', 'aluno');
});

test('testa rotas publicas de noticias e biblioteca', function () {
    // 1. Notícias públicas
    $respNoticias = $this->getJson('/api/noticias');
    $respNoticias->assertOk()
        ->assertJsonCount(5);

    $primeiraNoticia = $respNoticias->json('0.id');
    $this->getJson("/api/noticias/{$primeiraNoticia}")
        ->assertOk();

    // 2. Livros públicos (pré-carrega os 5 últimos cadastrados conforme apiContract.md)
    $respLivros = $this->getJson('/api/livros');
    $respLivros->assertOk()
        ->assertJsonCount(5);

    $livro = Livro::first();
    $this->getJson("/api/livros/{$livro->id_livro}")
        ->assertOk()
        ->assertJsonPath('titulo', $livro->titulo);

    $this->getJson("/api/livros/{$livro->id_livro}/disponibilidade")
        ->assertOk()
        ->assertJsonPath('disponivel', true);
});

test('testa rotas de calendario, eventos e radioatividades', function () {
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();

    // 1. Eventos
    $this->actingAs($admin, 'sanctum')->getJson('/api/eventos')
        ->assertOk()
        ->assertJsonCount(6);

    // 2. Datas importantes
    $this->actingAs($admin, 'sanctum')->getJson('/api/eventos/datas-importantes')
        ->assertOk()
        ->assertJsonCount(5);

    // 3. Radioatividades
    $this->actingAs($admin, 'sanctum')->getJson('/api/radioatividades')
        ->assertOk()
        ->assertJsonCount(3);
});

test('testa rotas de emprestimos de livros', function () {
    $yasmin = User::where('email', 'yasmin.teixeira@aluno.mg.gov.br')->first();
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();

    // 1. Meus empréstimos (Yasmin tem 2: 1 ativo e 1 devolvido)
    $this->actingAs($yasmin, 'sanctum')->getJson('/api/emprestimos/meus-emprestimos')
        ->assertOk()
        ->assertJsonCount(2);

    // 2. Listagem geral de empréstimos (Admin vê todos os 4)
    $this->actingAs($admin, 'sanctum')->getJson('/api/emprestimos')
        ->assertOk()
        ->assertJsonCount(4);
});

test('testa rotas academicas de turmas, disciplinas e matriculas', function () {
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();
    $yasmin = User::where('email', 'yasmin.teixeira@aluno.mg.gov.br')->first();

    // 1. Listar turmas
    $this->actingAs($admin, 'sanctum')->getJson('/api/turmas')
        ->assertOk()
        ->assertJsonCount(3);

    $turma1A = Turma::where('nome_identificador', '1º Ano A - Ensino Médio')->first();

    // 2. Listar alunos da turma 1A (1 aluno matriculado)
    $this->actingAs($admin, 'sanctum')->getJson("/api/turmas/{$turma1A->id_turma}/alunos")
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['name' => 'Yasmin Teixeira']);

    // 3. Listar disciplinas vinculadas à turma 1A
    $this->actingAs($admin, 'sanctum')->getJson("/api/turmas/{$turma1A->id_turma}/disciplinas")
        ->assertOk()
        ->assertJsonFragment(['nome' => 'Matemática'])
        ->assertJsonFragment(['nome' => 'Língua Portuguesa e Literatura']);

    // 4. Listar todas as disciplinas
    $this->actingAs($admin, 'sanctum')->getJson('/api/disciplinas')
        ->assertOk()
        ->assertJsonCount(5);

    // 5. Aluna Yasmin consulta suas turmas
    $this->actingAs($yasmin, 'sanctum')->getJson('/api/me/turmas')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['nome_identificador' => '1º Ano A - Ensino Médio']);
});

// [FORA DE ESCOPO - ARQUIVADO] test('testa rotas de remessas docentes', ...);

test('testa rotas de frequencia e relatorio de faltas', function () {
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();
    $yasmin = User::where('email', 'yasmin.teixeira@aluno.mg.gov.br')->first();
    $turma1A = Turma::where('nome_identificador', '1º Ano A - Ensino Médio')->first();
    $discMat = Disciplina::where('nome', 'Matemática')->first();

    // 1. Relatório de faltas da turma 1A em Matemática
    $this->actingAs($admin, 'sanctum')
        ->getJson("/api/frequencias/relatorio-faltas?turma_id={$turma1A->id_turma}&disciplina_id={$discMat->id_disciplina}")
        ->assertOk()
        ->assertJsonStructure([
            'turma' => ['id_turma', 'nome_identificador', 'ano_letivo'],
            'relatorio',
        ]);

    // 2. Aluna Yasmin consulta sua frequência individual
    $respFreq = $this->actingAs($yasmin, 'sanctum')->getJson('/api/frequencias/minha-frequencia');
    $respFreq->assertOk()
        ->assertJsonStructure([
            'resumo' => ['total_aulas', 'presencas', 'faltas', 'percentual_presenca'],
            'registros',
        ])
        ->assertJsonPath('resumo.faltas', 0)
        ->assertJsonPath('resumo.percentual_presenca', 100);
});

test('testa rotas de notas, medias e boletim escolar', function () {
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();
    $yasmin = User::where('email', 'yasmin.teixeira@aluno.mg.gov.br')->first();
    $turma1A = Turma::where('nome_identificador', '1º Ano A - Ensino Médio')->first();
    $discMat = Disciplina::where('nome', 'Matemática')->first();

    // 1. Média do 1º Bimestre da turma em Matemática
    $respMedia = $this->actingAs($admin, 'sanctum')
        ->getJson("/api/notas/media-periodo?turma_id={$turma1A->id_turma}&disciplina_id={$discMat->id_disciplina}&periodo_letivo=1º Bimestre");
    $respMedia->assertOk()
        ->assertJsonPath('periodo_letivo', '1º Bimestre')
        ->assertJsonStructure(['turma', 'disciplina', 'medias']);

    // 2. Admin gera boletim de Yasmin
    $respBoletimAdmin = $this->actingAs($admin, 'sanctum')->getJson("/api/notas/boletim/{$yasmin->id}");
    $respBoletimAdmin->assertOk()
        ->assertJsonPath('aluno.email', 'yasmin.teixeira@aluno.mg.gov.br')
        ->assertJsonFragment(['disciplina' => 'Matemática', 'status' => 'Aprovado']);

    // 3. Aluna Yasmin consulta seu próprio boletim
    $respMeuBoletim = $this->actingAs($yasmin, 'sanctum')->getJson('/api/notas/meu-boletim');
    $respMeuBoletim->assertOk()
        ->assertJsonPath('aluno.name', 'Yasmin Teixeira')
        ->assertJsonFragment(['disciplina' => 'Língua Portuguesa e Literatura']);
});

// [FORA DE ESCOPO - ARQUIVADO] test('testa rotas de atividades e submissoes povoadas', ...);
