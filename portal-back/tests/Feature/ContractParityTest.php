<?php

use App\Enums\UserRole;
use App\Models\Biblioteca;
use App\Models\DonaNanaConfig;
use App\Models\Emprestimo;
use App\Models\Evento;
use App\Models\Livro;
use App\Models\Noticia;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

/**
 * ContractParityTest - Paridade Estrutural dos API Resources com o apiContract.md
 *
 * Papel Didático:
 * Garante que os envelopes JSON devolvidos pelos módulos de Autenticação/Usuários,
 * Notícias, Biblioteca (Livros, Empréstimos, Biblioteca Pessoal), Eventos e Dona Nana
 * preservem todas as chaves contratadas pelo frontend.
 */
test('UsuarioResource preserva estrutura de contrato em /api/user e /api/usuarios', function () {
    $adm = criarUsuarioComPapel(UserRole::ADM, ['nickname' => 'AdminSebastiana']);
    Sanctum::actingAs($adm);

    $chavesUsuario = [
        'id',
        'name',
        'nickname',
        'email',
        'telefone',
        'avatar',
        'data_nascimento',
        'google_vinculado',
        'tem_senha',
        'role',
        'role_label',
        'turma',
        'turma_id',
        'ativo',
        'status_confirmacao',
        'confirmado_em',
        'autorizado_por_id',
        'autorizado_por_nome',
        'data_vinculo',
        'created_at',
        'comentario_admin',
        'permissoes',
    ];

    $this->getJson('/api/user')
        ->assertOk()
        ->assertJsonStructure($chavesUsuario)
        ->assertJsonPath('nickname', 'AdminSebastiana');

    $this->getJson('/api/usuarios')
        ->assertOk()
        ->assertJsonStructure(['data' => ['*' => $chavesUsuario], 'meta']);
});

test('NoticiaResource preserva estrutura de contrato em /api/noticias?all=true e /api/noticias/{id}', function () {
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);
    $noticia = Noticia::factory()->create([
        'autor_id' => $especialista->id,
        'destaque' => true,
    ]);

    $chavesNoticia = [
        'id',
        'categoria',
        'titulo',
        'descricao',
        'conteudo',
        'url_foto',
        'url_miniatura',
        'data_publicacao',
        'destaque',
        'autor' => ['id', 'name', 'nickname'],
        'created_at',
        'updated_at',
    ];

    $this->getJson('/api/noticias?all=true')
        ->assertOk()
        ->assertJsonStructure(['*' => $chavesNoticia]);

    $this->getJson("/api/noticias/{$noticia->id}")
        ->assertOk()
        ->assertJsonStructure($chavesNoticia);
});

test('LivroResource, EmprestimoResource e BibliotecaResource preservam estrutura de contrato da Biblioteca', function () {
    $bibliotecaria = criarUsuarioComPapel(UserRole::BIBLIOTECARIA);
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);

    $livro = Livro::factory()->create([
        'quantidade_total' => 4,
        'quantidade_disponivel' => 3,
    ]);

    Emprestimo::factory()->create([
        'livro_id' => $livro->id_livro,
        'usuario_id' => $aluno->id,
        'status' => 'solicitado',
    ]);

    Biblioteca::factory()->create([
        'user_id' => $bibliotecaria->id,
        'dados' => ['favoritos' => [$livro->id_livro]],
    ]);

    Sanctum::actingAs($bibliotecaria);

    $this->getJson('/api/livros')
        ->assertOk()
        ->assertJsonStructure([
            '*' => [
                'id',
                'id_livro',
                'codigo_livro',
                'titulo',
                'autor',
                'editora',
                'isbn',
                'data_lancamento',
                'data_publicacao',
                'ano_publicacao',
                'genero',
                'prateleira_localizacao',
                'localizacao',
                'capa',
                'capa_url',
                'quantidade_total',
                'quantidade_disponivel',
                'disponivel',
            ],
        ]);

    $this->getJson('/api/emprestimos')
        ->assertOk()
        ->assertJsonStructure([
            '*' => [
                'id',
                'id_emprestimo',
                'livro' => ['id', 'id_livro', 'titulo', 'autor', 'capa_url'],
                'usuario' => ['id', 'name', 'email'],
                'data_emprestimo',
                'data_prevista_devolucao',
                'data_devolucao_real',
                'status',
            ],
        ]);

    $this->getJson('/api/biblioteca')
        ->assertOk()
        ->assertJsonStructure(['id', 'usuario_id', 'dados']);
});

test('EventoResource, DonaNanaChatResource e DonaNanaConfigResource preservam estrutura de contrato', function () {
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);
    Evento::factory()->create(['criador_id' => $especialista->id]);
    DonaNanaConfig::factory()->create();

    Sanctum::actingAs($especialista);

    $this->getJson('/api/eventos')
        ->assertOk()
        ->assertJsonStructure([
            '*' => [
                'id',
                'titulo',
                'descricao',
                'data_inicio',
                'data_fim',
                'hora_inicio',
                'tipo',
                'importante',
                'is_aniversario',
                'local',
                'criador' => ['id', 'name'],
            ],
        ]);

    $this->getJson('/api/dona-nana/config')
        ->assertOk()
        ->assertJsonStructure([
            'id',
            'personalidade',
            'conhecimento_portal',
            'historias_causos',
            'diretrizes_resposta',
            'avatar_url',
            'modelo',
            'temperatura',
            'ativo',
            'prompt_montado',
            'updated_at',
        ]);

    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                ['content' => ['parts' => [['text' => 'Olá, querido estudante!']]]],
            ],
        ], 200),
    ]);

    $this->postJson('/api/dona-nana/chat', ['mensagem' => 'Quem foi Dona Sebastiana?'])
        ->assertOk()
        ->assertJsonStructure([
            'resposta',
            'sugestoes',
            'autor',
            'origem',
            'timestamp',
        ]);
});
