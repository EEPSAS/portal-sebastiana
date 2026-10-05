<?php

use App\Models\Atividade;
use App\Models\Disciplina;
use App\Models\Livro;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

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
        ->assertJsonPath('user.role', 'especialista');

    // 4. Login como Aluna Yasmin
    $respAluna = $this->postJson('/api/auth/login', [
        'email' => 'yasmin.teixeira@sebastiana.edu.br',
        'password' => 'password',
    ]);
    $respAluna->assertOk()
        ->assertJsonPath('user.role', 'padrao');
});

test('testa rotas publicas de noticias e biblioteca', function () {
    // 1. Notícias públicas
    $respNoticias = $this->getJson('/api/noticias');
    $respNoticias->assertOk()
        ->assertJsonCount(3);

    $primeiraNoticia = $respNoticias->json('0.id');
    $this->getJson("/api/noticias/{$primeiraNoticia}")
        ->assertOk();

    // 2. Livros públicos
    $respLivros = $this->getJson('/api/livros');
    $respLivros->assertOk()
        ->assertJsonCount(6);

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
    $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
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
    $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();

    // 1. Listar turmas
    $this->actingAs($admin, 'sanctum')->getJson('/api/turmas')
        ->assertOk()
        ->assertJsonCount(3);

    $turma1A = Turma::where('nome_identificador', '1º Ano A - Ensino Médio')->first();

    // 2. Listar alunos da turma 1A (4 alunos matriculados)
    $this->actingAs($admin, 'sanctum')->getJson("/api/turmas/{$turma1A->id_turma}/alunos")
        ->assertOk()
        ->assertJsonCount(4)
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

test('testa rotas de remessas docentes', function () {
    $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();

    // 1. Professor Carlos consulta suas remessas enviadas (2 remessas)
    $this->actingAs($profCarlos, 'sanctum')->getJson('/api/remessas/minhas')
        ->assertOk()
        ->assertJsonCount(2);

    // 2. Admin lista remessas pendentes (1 pendente de Física)
    $this->actingAs($admin, 'sanctum')->getJson('/api/remessas/pendentes')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.status_processamento', 'Pendente');
});

test('testa rotas de frequencia e relatorio de faltas', function () {
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();
    $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
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
    $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
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
        ->assertJsonPath('aluno.email', 'yasmin.teixeira@sebastiana.edu.br')
        ->assertJsonFragment(['disciplina' => 'Matemática', 'status' => 'Aprovado']);

    // 3. Aluna Yasmin consulta seu próprio boletim
    $respMeuBoletim = $this->actingAs($yasmin, 'sanctum')->getJson('/api/notas/meu-boletim');
    $respMeuBoletim->assertOk()
        ->assertJsonPath('aluno.name', 'Yasmin Teixeira')
        ->assertJsonFragment(['disciplina' => 'Língua Portuguesa e Literatura']);
});

test('testa rotas de atividades e submissoes povoadas', function () {
    $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
    $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
    $turma1A = Turma::where('nome_identificador', '1º Ano A - Ensino Médio')->first();
    $discMat = Disciplina::where('nome', 'Matemática')->first();

    // 1. Aluna Yasmin lista atividades com status de sua submissão
    $respAtividades = $this->actingAs($yasmin, 'sanctum')->getJson('/api/atividades');
    $respAtividades->assertOk()
        ->assertJsonCount(4)
        ->assertJsonStructure([
            '*' => ['id_atividade', 'titulo', 'status_atividade', 'minha_submissao'],
        ]);

    // 2. Listar atividades por turma e disciplina (1º Ano A / Matemática)
    $this->actingAs($yasmin, 'sanctum')
        ->getJson("/api/turmas/{$turma1A->id_turma}/disciplinas/{$discMat->id_disciplina}/atividades")
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['titulo' => 'Lista de Exercícios: Equações do 2º Grau e Vértice da Parábola']);

    // 3. Professor Carlos lista submissões da atividade de Física
    $ativFisica = Atividade::where('titulo', 'like', '%Leis de Newton%')->first();
    $this->actingAs($profCarlos, 'sanctum')
        ->getJson("/api/atividades/{$ativFisica->id_atividade}/submissoes")
        ->assertOk()
        ->assertJsonPath('total', 3);

    // 4. Yasmin consulta sua submissão na atividade de Física avaliada
    $this->actingAs($yasmin, 'sanctum')
        ->getJson("/api/atividades/{$ativFisica->id_atividade}/minha-submissao")
        ->assertOk()
        ->assertJsonPath('nota_atribuida', 9.8)
        ->assertJsonPath('feedback_comentario_professor', 'Excelente trabalho! Os gráficos e o cálculo do desvio padrão ficaram impecáveis.');
});
