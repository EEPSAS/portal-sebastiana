<?php

use App\Models\Noticia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('qualquer visitante pode listar notícias com paginação', function () {
    $autor = User::factory()->adm()->create();
    Noticia::factory()->count(15)->create(['autor_id' => $autor->id]);

    $response = $this->getJson('/api/noticias?per_page=10');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'categoria',
                    'titulo',
                    'descricao',
                    'conteudo',
                    'url_foto',
                    'url_miniatura',
                    'data_publicacao',
                    'destaque',
                    'autor',
                ],
            ],
            'meta' => [
                'current_page',
                'total',
                'per_page',
            ],
        ]);

    expect(count($response->json('data')))->toBe(10);
});

test('qualquer visitante pode visualizar detalhes de uma notícia existente', function () {
    $autor = User::factory()->adm()->create();
    $noticia = Noticia::factory()->create([
        'autor_id' => $autor->id,
        'titulo' => 'Feira de Ciências 2026',
    ]);

    $response = $this->getJson("/api/noticias/{$noticia->id}");

    $response->assertOk()
        ->assertJsonPath('titulo', 'Feira de Ciências 2026')
        ->assertJsonPath('autor.name', $autor->name);
});

test('especialista pode cadastrar nova notícia com sucesso', function () {
    $especialista = User::factory()->especialista()->create();

    $payload = [
        'titulo' => 'Semana de Orientação Pedagógica',
        'categoria' => 'Pedagógico',
        'descricao' => 'Resumo da semana pedagógica para o corpo docente e discente.',
        'conteudo' => 'Texto detalhado com orientações, horários e cronograma.',
        'url_foto' => 'https://exemplo.com/foto.jpg',
        'destaque' => true,
    ];

    $response = $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/noticias', $payload);

    $response->assertCreated()
        ->assertJsonPath('titulo', 'Semana de Orientação Pedagógica')
        ->assertJsonPath('destaque', true)
        ->assertJsonPath('autor.id', $especialista->id);

    $this->assertDatabaseHas('noticias', [
        'titulo' => 'Semana de Orientação Pedagógica',
        'autor_id' => $especialista->id,
        'destaque' => true,
    ]);
});

test('administrador pode cadastrar nova notícia com sucesso', function () {
    $adm = User::factory()->adm()->create();

    $payload = [
        'titulo' => 'Reforma na Biblioteca Concluída',
        'conteudo' => 'O espaço de leitura foi ampliado com novos computadores e mesas.',
    ];

    $response = $this->actingAs($adm, 'sanctum')
        ->postJson('/api/noticias', $payload);

    $response->assertCreated()
        ->assertJsonPath('titulo', 'Reforma na Biblioteca Concluída');
});

test('visitante deslogado não pode cadastrar notícia', function () {
    $payload = [
        'titulo' => 'Tentativa Não Autorizada',
        'conteudo' => 'Conteúdo de teste.',
    ];

    $this->postJson('/api/noticias', $payload)->assertUnauthorized();
});

test('aluno não pode excluir notícias', function () {
    $aluno = User::factory()->aluno()->create();
    $adm = User::factory()->adm()->create();
    $noticia = Noticia::factory()->create(['autor_id' => $adm->id]);

    $this->actingAs($aluno, 'sanctum')
        ->deleteJson("/api/noticias/{$noticia->id}")
        ->assertForbidden();
});

test('especialista ou administrador pode atualizar notícia', function () {
    $adm = User::factory()->adm()->create();
    $noticia = Noticia::factory()->create([
        'autor_id' => $adm->id,
        'titulo' => 'Título Inicial',
    ]);

    $response = $this->actingAs($adm, 'sanctum')
        ->putJson("/api/noticias/{$noticia->id}", [
            'titulo' => 'Título Atualizado Com Sucesso',
            'conteudo' => 'Novo conteúdo da matéria.',
        ]);

    $response->assertOk()
        ->assertJsonPath('titulo', 'Título Atualizado Com Sucesso');

    $this->assertDatabaseHas('noticias', [
        'id' => $noticia->id,
        'titulo' => 'Título Atualizado Com Sucesso',
    ]);
});

test('especialista ou administrador pode excluir notícia', function () {
    $adm = User::factory()->adm()->create();
    $noticia = Noticia::factory()->create(['autor_id' => $adm->id]);

    $response = $this->actingAs($adm, 'sanctum')
        ->deleteJson("/api/noticias/{$noticia->id}");

    $response->assertOk();

    $this->assertDatabaseMissing('noticias', [
        'id' => $noticia->id,
    ]);
});

test('marcar nova notícia como destaque desmarca a notícia anterior', function () {
    $adm = User::factory()->adm()->create();
    $noticiaAntiga = Noticia::factory()->create([
        'autor_id' => $adm->id,
        'destaque' => true,
    ]);

    $novaNoticiaPayload = [
        'titulo' => 'Novo Destaque Principal',
        'conteudo' => 'Esta agora é a notícia principal do portal.',
        'destaque' => true,
    ];

    $response = $this->actingAs($adm, 'sanctum')
        ->postJson('/api/noticias', $novaNoticiaPayload);

    $response->assertCreated()
        ->assertJsonPath('destaque', true);

    expect($noticiaAntiga->fresh()->destaque)->toBeFalse();
});

test('especialista pode cadastrar notícia enviando arquivos de capa e miniatura', function () {
    Storage::fake('public');

    $especialista = User::factory()->especialista()->create();
    $capa = UploadedFile::fake()->create('capa.jpg', 500, 'image/jpeg');
    $miniatura = UploadedFile::fake()->create('mini.jpg', 200, 'image/jpeg');

    $response = $this->actingAs($especialista, 'sanctum')
        ->post('/api/noticias', [
            'titulo' => 'Oficina de Robótica 2026',
            'categoria' => 'Projetos',
            'descricao' => 'Estudantes desenvolvem projetos com Arduino.',
            'conteudo' => 'Conteúdo detalhado sobre a oficina de tecnologia.',
            'foto' => $capa,
            'miniatura_arquivo' => $miniatura,
            'destaque' => true,
        ]);

    $response->assertCreated()
        ->assertJsonPath('titulo', 'Oficina de Robótica 2026')
        ->assertJsonPath('categoria', 'Projetos');

    $noticia = Noticia::where('titulo', 'Oficina de Robótica 2026')->first();
    expect($noticia)->not->toBeNull();
    expect($noticia->imagem)->toContain('noticias/capas/');
    expect($noticia->miniatura)->toContain('noticias/miniaturas/');
    Storage::disk('public')->assertExists($noticia->imagem);
    Storage::disk('public')->assertExists($noticia->miniatura);
});
