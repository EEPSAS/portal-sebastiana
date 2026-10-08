<?php

use App\Models\Disciplina;
use App\Models\Livro;
use App\Models\Noticia;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\UsuarioSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(UsuarioSeeder::class);
});

test('administrador possui acesso total e pode gerenciar usuarios, papeis e bloqueios', function () {
    $admin = User::where('email', 'admin@sebastiana.edu.br')->first();
    $aluno = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();

    // 1. Admin lista usuários
    $this->actingAs($admin, 'sanctum')->getJson('/api/usuarios')
        ->assertOk()
        ->assertJsonFragment(['email' => 'yasmin.teixeira@sebastiana.edu.br']);

    // 2. Admin cadastra novo usuário como Bibliotecária
    $respNovo = $this->actingAs($admin, 'sanctum')->postJson('/api/usuarios', [
        'name' => 'Nova Bibliotecária Auxiliar',
        'email' => 'auxiliar.biblioteca@sebastiana.edu.br',
        'password' => 'password123',
        'role' => 'bibliotecaria',
    ]);
    $respNovo->assertCreated()
        ->assertJsonPath('role', 'bibliotecaria');

    $novoId = $respNovo->json('id');

    // 3. Admin altera papel de Aluno para Especialista
    $this->actingAs($admin, 'sanctum')->patchJson("/api/usuarios/{$aluno->id}/papel", [
        'role' => 'especialista',
    ])->assertOk()
        ->assertJsonPath('usuario.role', 'especialista');

    expect($aluno->fresh()->hasRole('especialista'))->toBeTrue();

    // 4. Admin bloqueia usuário e login do usuário bloqueado é rejeitado com 403
    $this->actingAs($admin, 'sanctum')->patchJson("/api/usuarios/{$novoId}/bloquear", [
        'ativo' => false,
    ])->assertOk()
        ->assertJsonPath('usuario.ativo', false);

    $this->postJson('/api/auth/login', [
        'email' => 'auxiliar.biblioteca@sebastiana.edu.br',
        'password' => 'password123',
    ])->assertStatus(403)
        ->assertJsonPath('message', 'Usuário bloqueado pelo administrador. Acesso negado.');

    // 5. Admin consulta papéis e permissões
    $this->actingAs($admin, 'sanctum')->getJson('/api/papeis')
        ->assertOk()
        ->assertJsonFragment(['slug' => 'aluno'])
        ->assertJsonFragment(['slug' => 'especialista']);

    $this->actingAs($admin, 'sanctum')->getJson('/api/permissoes')
        ->assertOk()
        ->assertJsonFragment(['slug' => 'gerenciar_usuarios']);
});

test('usuario nao-administrador e impedido de acessar painel de gestao de usuarios', function () {
    $aluno = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
    $prof = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();

    $this->actingAs($aluno, 'sanctum')->getJson('/api/usuarios')
        ->assertForbidden();

    $this->actingAs($prof, 'sanctum')->getJson('/api/papeis')
        ->assertForbidden();

    $this->actingAs($aluno, 'sanctum')->postJson('/api/usuarios', [
        'name' => 'Teste Hacker',
        'email' => 'hacker@teste.com',
        'password' => '12345678',
    ])->assertForbidden();
});

test('bibliotecaria pode gerenciar livros e emprestimos mas nao tem acesso a gestao academica ou de usuarios', function () {
    $biblio = User::where('email', 'bibliotecaria@sebastiana.edu.br')->first();
    $aluno = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();

    // 1. Bibliotecária cria um livro
    $respLivro = $this->actingAs($biblio, 'sanctum')->postJson('/api/livros', [
        'titulo' => 'Livro Cadastrado pela Bibliotecária',
        'autor' => 'Autor Exemplo',
        'editora' => 'Editora Teste',
        'genero' => 'Ficção',
        'quantidade_total' => 5,
        'quantidade_disponivel' => 5,
    ]);
    $respLivro->assertCreated();
    $livroId = $respLivro->json('id_livro');

    // 2. Aluno solicita empréstimo
    $respEmp = $this->actingAs($aluno, 'sanctum')->postJson('/api/emprestimos/solicitar', [
        'livro_id' => $livroId,
    ]);
    $respEmp->assertCreated();
    $empId = $respEmp->json('id_emprestimo');

    // 3. Bibliotecária aprova o empréstimo
    $this->actingAs($biblio, 'sanctum')->patchJson("/api/emprestimos/{$empId}/aprovar")
        ->assertOk()
        ->assertJsonPath('status', 'aprovado');

    // 4. Bibliotecária é bloqueada ao tentar criar turmas (módulo acadêmico)
    $this->actingAs($biblio, 'sanctum')->postJson('/api/turmas', [
        'nome_identificador' => 'Turma Indevida',
        'turno' => 'Manhã',
        'ano_letivo' => 2026,
        'capacidade_maxima' => 30,
    ])->assertForbidden();
});

test('professor pode criar e editar apenas noticias proprias e enviar remessas somente onde for vinculado', function () {
    $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
    $profaMarina = User::where('email', 'marina.souza@sebastiana.edu.br')->first();

    // 1. Prof Carlos cria uma notícia
    $respNoticia = $this->actingAs($profCarlos, 'sanctum')->postJson('/api/noticias', [
        'titulo' => 'Notícia do Prof Carlos',
        'descricao' => 'Resumo da notícia do professor',
        'conteudo' => 'Texto explicativo sobre a aula de física experimental.',
        'categoria' => 'Aulas',
    ]);
    $respNoticia->assertCreated();
    $noticiaId = $respNoticia->json('id');

    // 2. Prof Carlos pode atualizar sua própria notícia
    $this->actingAs($profCarlos, 'sanctum')->putJson("/api/noticias/{$noticiaId}", [
        'titulo' => 'Notícia do Prof Carlos Atualizada',
    ])->assertOk();

    // 3. Profa Marina é bloqueada ao tentar editar a notícia de Carlos
    $this->actingAs($profaMarina, 'sanctum')->putJson("/api/noticias/{$noticiaId}", [
        'titulo' => 'Tentativa de Edição por Outro Docente',
    ])->assertForbidden();

    // 4. Teste de vinculação em remessas docentes:
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    // Prof Carlos tenta enviar remessa para turma onde NÃO está vinculado -> deve retornar 403
    $this->actingAs($profCarlos, 'sanctum')->postJson('/api/remessas', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'tipo_dado' => 'Frequência',
    ])->assertStatus(403)
        ->assertJsonPath('message', 'Você só pode enviar remessas para turmas e disciplinas às quais está formalmente vinculado.');

    // Vincula Prof Carlos à turma e disciplina
    TurmaDisciplina::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $profCarlos->id,
    ]);

    // Agora Prof Carlos consegue enviar a remessa com sucesso
    $this->actingAs($profCarlos, 'sanctum')->postJson('/api/remessas', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'tipo_dado' => 'Frequência',
    ])->assertCreated();
});

test('aluno tem acesso restrito ao consumo e e bloqueado em operacoes de gestao', function () {
    $aluno = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
    $livro = Livro::factory()->create();

    // Aluno visualiza livros públicos
    $this->actingAs($aluno, 'sanctum')->getJson('/api/livros')
        ->assertOk();

    // Aluno tenta criar livro -> bloqueado
    $this->actingAs($aluno, 'sanctum')->postJson('/api/livros', [
        'titulo' => 'Livro Ilegal',
        'autor' => 'Autor',
        'editora' => 'Editora',
        'quantidade_total' => 1,
        'quantidade_disponivel' => 1,
    ])->assertForbidden();

    // Aluno tenta criar turma -> bloqueado
    $this->actingAs($aluno, 'sanctum')->postJson('/api/turmas', [
        'nome_identificador' => 'Turma dos Alunos',
        'turno' => 'Tarde',
        'ano_letivo' => 2026,
    ])->assertForbidden();
});

test('aluno e todos os usuarios podem criar noticias e seus proprios eventos no calendario', function () {
    $aluno = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
    $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();

    // 1. Aluno cria notícia com sucesso
    $respNoticia = $this->actingAs($aluno, 'sanctum')->postJson('/api/noticias', [
        'titulo' => 'Notícia do Grêmio Estudantil',
        'descricao' => 'Comunicado sobre o campeonato de xadrez',
        'conteudo' => 'Estão abertas as inscrições para o torneio de xadrez da escola.',
        'categoria' => 'Estudantil',
    ]);
    $respNoticia->assertCreated()
        ->assertJsonPath('titulo', 'Notícia do Grêmio Estudantil')
        ->assertJsonPath('autor.id', $aluno->id);

    $noticiaId = $respNoticia->json('id');

    // 2. Aluno pode editar sua própria notícia
    $this->actingAs($aluno, 'sanctum')->putJson("/api/noticias/{$noticiaId}", [
        'titulo' => 'Notícia do Grêmio Estudantil (Atualizada)',
    ])->assertOk();

    // 3. Aluno não pode editar notícia do professor
    $noticiaProf = Noticia::factory()->create(['autor_id' => $profCarlos->id]);
    $this->actingAs($aluno, 'sanctum')->putJson("/api/noticias/{$noticiaProf->id}", [
        'titulo' => 'Tentativa Indevida de Edição',
    ])->assertForbidden();

    // 4. Aluno cadastra evento próprio no calendário
    $respEvento = $this->actingAs($aluno, 'sanctum')->postJson('/api/eventos', [
        'titulo' => 'Apresentação de Seminário Pessoal',
        'data_inicio' => '2026-11-10',
        'tipo' => 'Provas e Trabalhos',
    ]);
    $respEvento->assertCreated()
        ->assertJsonPath('criador.id', $aluno->id);
});
