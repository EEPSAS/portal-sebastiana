<?php

use App\Models\Livro;
use App\Models\PlanoEstudo;
use App\Models\PlanoEstudoItem;
use App\Models\User;

test('usuario autenticado pode criar um plano de estudos', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/planos-estudos', [
            'nome' => 'Preparação ENEM 2026',
            'disciplina' => 'Matemática',
            'descricao' => 'Foco em funções e geometria espacial',
        ]);

    $response->assertCreated()
        ->assertJsonPath('nome', 'Preparação ENEM 2026')
        ->assertJsonPath('disciplina', 'Matemática')
        ->assertJsonPath('total_itens', 0);

    $this->assertDatabaseHas('planos_estudos', [
        'nome' => 'Preparação ENEM 2026',
        'user_id' => $user->id,
    ]);
});

test('usuario autenticado pode listar seus planos de estudo com contadores reais por tipo', function () {
    $user = User::factory()->create();

    $plano = PlanoEstudo::create([
        'user_id' => $user->id,
        'nome' => 'Trilha de Física Quântica',
        'disciplina' => 'Física',
    ]);

    // Adiciona 1 videoaula e 1 livro
    PlanoEstudoItem::create([
        'plano_estudo_id' => $plano->id,
        'tipo' => 'videoaula',
        'conteudo_id' => 'yt_123',
        'titulo' => 'Introdução à Física Moderna',
        'url' => 'https://www.youtube.com/watch?v=123',
    ]);

    PlanoEstudoItem::create([
        'plano_estudo_id' => $plano->id,
        'tipo' => 'livro',
        'conteudo_id' => 'bk_456',
        'titulo' => 'Física Clássica e Moderna Vol 1',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/planos-estudos');

    $response->assertOk()
        ->assertJsonFragment([
            'nome' => 'Trilha de Física Quântica',
            'disciplina' => 'Física',
            'videoaulas_count' => 1,
            'livros_count' => 1,
            'conteudos_web_count' => 0,
            'total_itens' => 2,
        ]);
});

test('usuario pode adicionar videoaula com duracao e url, livro vinculado e conteudo web ao seu plano de estudos', function () {
    $user = User::factory()->create();
    $livro = Livro::factory()->create([
        'codigo_livro' => 'LIV-5555',
        'titulo' => 'História Geral do Brasil',
    ]);
    $plano = PlanoEstudo::create([
        'user_id' => $user->id,
        'nome' => 'História do Brasil',
        'disciplina' => 'História',
    ]);

    // Adiciona videoaula capturando duração e URL
    $responseVideo = $this->actingAs($user, 'sanctum')
        ->postJson("/api/planos-estudos/{$plano->id}/itens", [
            'tipo' => 'videoaula',
            'conteudo_id' => 'vid_abc',
            'titulo' => 'A Era Vargas em 20 minutos',
            'url' => 'https://www.youtube.com/watch?v=abc',
            'thumbnail' => 'https://img.youtube.com/vi/abc/0.jpg',
            'fonte' => 'Canal História Ilustrada',
            'duracao' => '20:15',
        ]);

    $responseVideo->assertCreated()
        ->assertJsonPath('titulo', 'A Era Vargas em 20 minutos')
        ->assertJsonPath('duracao', '20:15')
        ->assertJsonPath('url', 'https://www.youtube.com/watch?v=abc');

    $this->assertDatabaseHas('plano_estudo_itens', [
        'plano_estudo_id' => $plano->id,
        'tipo' => 'videoaula',
        'duracao' => '20:15',
        'url' => 'https://www.youtube.com/watch?v=abc',
    ]);

    // Adiciona Livro do acervo e valida vínculo relacional livro_id
    $responseLivro = $this->actingAs($user, 'sanctum')
        ->postJson("/api/planos-estudos/{$plano->id}/itens", [
            'tipo' => 'livro',
            'conteudo_id' => (string) $livro->id_livro,
            'titulo' => $livro->titulo,
            'fonte' => $livro->editora,
        ]);

    $responseLivro->assertCreated()
        ->assertJsonPath('livro_id', $livro->id_livro);

    expect($livro->planoEstudoItens()->count())->toBe(1);

    // Adiciona Conteúdo Web
    $responseWeb = $this->actingAs($user, 'sanctum')
        ->postJson("/api/planos-estudos/{$plano->id}/itens", [
            'tipo' => 'conteudo_web',
            'conteudo_id' => 'gbooks_xyz',
            'titulo' => 'Raízes do Brasil - Sérgio Buarque',
            'url' => 'https://books.google.com/xyz',
            'thumbnail' => 'https://books.google.com/thumb.jpg',
            'fonte' => 'Companhia das Letras',
        ]);

    $responseWeb->assertCreated()
        ->assertJsonPath('titulo', 'Raízes do Brasil - Sérgio Buarque');

    $this->assertDatabaseCount('plano_estudo_itens', 3);
});

test('impede adicao em duplicidade do mesmo conteudo ao mesmo plano', function () {
    $user = User::factory()->create();
    $plano = PlanoEstudo::create([
        'user_id' => $user->id,
        'nome' => 'Biologia Geral',
        'disciplina' => 'Biologia',
    ]);

    // Primeira adição
    $this->actingAs($user, 'sanctum')
        ->postJson("/api/planos-estudos/{$plano->id}/itens", [
            'tipo' => 'videoaula',
            'conteudo_id' => 'bio_101',
            'titulo' => 'Divisão Celular Mitose e Meiose',
            'url' => 'https://www.youtube.com/watch?v=bio_101',
        ])
        ->assertCreated();

    // Segunda tentativa de adicionar o MESMO conteúdo
    $responseDuplicado = $this->actingAs($user, 'sanctum')
        ->postJson("/api/planos-estudos/{$plano->id}/itens", [
            'tipo' => 'videoaula',
            'conteudo_id' => 'bio_101',
            'titulo' => 'Divisão Celular Mitose e Meiose',
            'url' => 'https://www.youtube.com/watch?v=bio_101',
        ]);

    $responseDuplicado->assertStatus(422)
        ->assertJsonValidationErrors(['conteudo']);

    $this->assertDatabaseCount('plano_estudo_itens', 1);
});

test('usuario pode visualizar plano completo com itens e depois remover um item sem excluir a biblioteca', function () {
    $user = User::factory()->create();
    $plano = PlanoEstudo::create([
        'user_id' => $user->id,
        'nome' => 'Química Orgânica',
        'disciplina' => 'Química',
    ]);

    $item = PlanoEstudoItem::create([
        'plano_estudo_id' => $plano->id,
        'tipo' => 'videoaula',
        'conteudo_id' => 'chem_01',
        'titulo' => 'Hidrocarbonetos e Nomenclatura',
        'url' => 'https://www.youtube.com/watch?v=chem_01',
    ]);

    // Consulta do plano completo (show)
    $responseShow = $this->actingAs($user, 'sanctum')
        ->getJson("/api/planos-estudos/{$plano->id}");

    $responseShow->assertOk()
        ->assertJsonPath('nome', 'Química Orgânica')
        ->assertJsonCount(1, 'itens');

    // Remoção do item do plano
    $responseDelete = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/planos-estudos/{$plano->id}/itens/{$item->id}");

    $responseDelete->assertOk()
        ->assertJsonPath('message', 'Conteúdo removido do plano de estudos com sucesso.');

    $this->assertDatabaseMissing('plano_estudo_itens', ['id' => $item->id]);
    $this->assertDatabaseHas('planos_estudos', ['id' => $plano->id]);
});

test('excluir plano de estudos remove os itens associados em cascata', function () {
    $user = User::factory()->create();
    $plano = PlanoEstudo::create([
        'user_id' => $user->id,
        'nome' => 'Plano Temporário',
        'disciplina' => 'Redação',
    ]);

    PlanoEstudoItem::create([
        'plano_estudo_id' => $plano->id,
        'tipo' => 'conteudo_web',
        'titulo' => 'Dicas de Argumentação',
    ]);

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/planos-estudos/{$plano->id}")
        ->assertOk();

    $this->assertDatabaseMissing('planos_estudos', ['id' => $plano->id]);
    $this->assertDatabaseCount('plano_estudo_itens', 0);
});
