<?php

use App\Models\Livro;
use App\Models\User;

test('anyone can view book list and single book details', function () {
    $livro = Livro::factory()->create([
        'titulo' => 'Dom Casmurro',
        'autor' => 'Machado de Assis',
        'genero' => 'Literatura Brasileira',
    ]);

    $this->getJson('/api/livros')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'Dom Casmurro']);

    $this->getJson("/api/livros/{$livro->id_livro}")
        ->assertOk()
        ->assertJsonPath('autor', 'Machado de Assis');
});

test('can filter books by search query, genre and availability', function () {
    Livro::factory()->create([
        'titulo' => 'O Hobbit',
        'autor' => 'J.R.R. Tolkien',
        'genero' => 'Fantasia',
        'quantidade_disponivel' => 3,
    ]);

    Livro::factory()->indisponivel()->create([
        'titulo' => 'Livro Esgotado',
        'autor' => 'Autor X',
        'genero' => 'Ficção',
        'quantidade_disponivel' => 0,
    ]);

    // Search query
    $this->getJson('/api/livros?q=Hobbit')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'O Hobbit'])
        ->assertJsonMissing(['titulo' => 'Livro Esgotado']);

    // Genre filter
    $this->getJson('/api/livros?genero=Fantasia')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'O Hobbit']);

    // Only available filter
    $this->getJson('/api/livros?apenas_disponiveis=1')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'O Hobbit'])
        ->assertJsonMissing(['titulo' => 'Livro Esgotado']);
});

test('standard user cannot create, update or delete books', function () {
    $user = User::factory()->create(['role' => 'padrao']);
    $livro = Livro::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/livros', [
            'titulo' => 'Livro Ilegal',
            'autor' => 'Hacker',
            'quantidade_total' => 1,
        ])
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/livros/{$livro->id_livro}", [
            'titulo' => 'Tentativa Edição',
        ])
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/livros/{$livro->id_livro}")
        ->assertForbidden();
});

test('admin and especialista can create, update and delete books', function () {
    $adm = User::factory()->create(['role' => 'adm']);

    // Create
    $response = $this->actingAs($adm, 'sanctum')
        ->postJson('/api/livros', [
            'titulo' => 'Capitães da Areia',
            'autor' => 'Jorge Amado',
            'editora' => 'Companhia das Letras',
            'genero' => 'Romance',
            'prateleira_localizacao' => 'Corredor A, Estante 1',
            'quantidade_total' => 5,
        ]);

    $response->assertCreated()
        ->assertJsonPath('titulo', 'Capitães da Areia')
        ->assertJsonPath('quantidade_disponivel', 5);

    $livroId = $response->json('id_livro');

    // Update
    $this->actingAs($adm, 'sanctum')
        ->putJson("/api/livros/{$livroId}", [
            'titulo' => 'Capitães da Areia - Edição Especial',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Capitães da Areia - Edição Especial');

    // Delete
    $this->actingAs($adm, 'sanctum')
        ->deleteJson("/api/livros/{$livroId}")
        ->assertNoContent();

    expect(Livro::find($livroId))->toBeNull();
});

test('validates book creation fields', function () {
    $adm = User::factory()->create(['role' => 'adm']);

    $this->actingAs($adm, 'sanctum')
        ->postJson('/api/livros', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['titulo', 'autor', 'quantidade_total']);
});

test('can check book availability endpoint', function () {
    $livroDisponivel = Livro::factory()->create([
        'quantidade_total' => 3,
        'quantidade_disponivel' => 2,
    ]);

    $livroIndisponivel = Livro::factory()->indisponivel()->create();

    $this->getJson("/api/livros/{$livroDisponivel->id_livro}/disponibilidade")
        ->assertOk()
        ->assertJsonPath('disponivel', true)
        ->assertJsonPath('quantidade_disponivel', 2);

    $this->getJson("/api/livros/{$livroIndisponivel->id_livro}/disponibilidade")
        ->assertOk()
        ->assertJsonPath('disponivel', false)
        ->assertJsonPath('quantidade_disponivel', 0);
});
