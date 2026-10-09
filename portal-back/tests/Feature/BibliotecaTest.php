<?php

use App\Models\User;

test('requires authentication to read or save the library', function () {
    $this->getJson('/api/biblioteca')->assertUnauthorized();
    $this->putJson('/api/biblioteca', ['dados' => []])->assertUnauthorized();
});

test('stores separate library data for each authenticated user', function () {
    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();
    $firstLibrary = [
        'livros' => [],
        'planos' => [['id' => 1, 'nome' => 'Plano pessoal', 'disciplina' => 'Matemática', 'livroIds' => [], 'apostilaIds' => [], 'ativo' => true]],
        'videoaulas' => [],
        'apostilas' => [],
    ];

    $this->actingAs($firstUser, 'sanctum')
        ->putJson('/api/biblioteca', ['dados' => $firstLibrary])
        ->assertOk()
        ->assertJsonPath('dados.planos.0.nome', 'Plano pessoal');

    $this->actingAs($secondUser, 'sanctum')
        ->getJson('/api/biblioteca')
        ->assertOk()
        ->assertJsonPath('dados', null);

    $this->actingAs($secondUser, 'sanctum')
        ->putJson('/api/biblioteca', ['dados' => [
            'livros' => [],
            'planos' => [['id' => 2, 'nome' => 'Plano da segunda conta', 'disciplina' => 'História', 'livroIds' => [], 'apostilaIds' => [], 'ativo' => false]],
            'videoaulas' => [],
            'apostilas' => [],
        ]])->assertOk();

    $this->actingAs($firstUser, 'sanctum')
        ->getJson('/api/biblioteca')
        ->assertOk()
        ->assertJsonPath('dados.planos.0.nome', 'Plano pessoal');

    $firstUser->refresh();
    $secondUser->refresh();

    expect($firstUser->biblioteca)->not->toBeNull()
        ->and($secondUser->biblioteca)->not->toBeNull()
        ->and($firstUser->biblioteca->id)->not->toBe($secondUser->biblioteca->id);
});

test('validates the complete library document before saving', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/biblioteca', ['dados' => ['planos' => []]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['dados.livros', 'dados.videoaulas', 'dados.apostilas']);

    expect($user->biblioteca)->toBeNull();
});

test('stores valid video and web-content URLs and rejects invalid ones', function () {
    $user = User::factory()->create();
    $url = 'https://www.youtube.com/watch?v=abc123';
    $webUrl = 'https://escola.example/conteudos/funcoes';
    $dados = [
        'livros' => [],
        'planos' => [],
        'videoaulas' => [[
            'id' => 1,
            'titulo' => 'Introdução à Matemática',
            'materia' => 'Matemática',
            'corBadge' => '#2563eb',
            'descricao' => 'Aula de introdução.',
            'url' => $url,
        ]],
        'apostilas' => [[
            'id' => 1,
            'titulo' => 'Funções matemáticas',
            'materia' => 'Matemática',
            'descricao' => 'Material de apoio online.',
            'topico' => 'Funções',
            'tipo' => 'Texto',
            'nivel' => '1º ano',
            'autor' => 'Equipe pedagógica',
            'corBadge' => '#e0f2fe',
            'corTexto' => '#0284c7',
            'url' => $webUrl,
        ]],
    ];

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/biblioteca', ['dados' => $dados])
        ->assertOk()
        ->assertJsonPath('dados.videoaulas.0.url', $url)
        ->assertJsonPath('dados.apostilas.0.url', $webUrl);

    $dados['videoaulas'][0]['url'] = 'não é uma url';

    $this->putJson('/api/biblioteca', ['dados' => $dados])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('dados.videoaulas.0.url');

    $dados['videoaulas'][0]['url'] = $url;
    $dados['apostilas'][0]['url'] = 'não é uma url';

    $this->putJson('/api/biblioteca', ['dados' => $dados])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('dados.apostilas.0.url');
});
