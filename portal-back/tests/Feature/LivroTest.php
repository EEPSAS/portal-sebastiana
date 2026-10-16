<?php

use App\Models\Livro;
use App\Models\User;
use Illuminate\Http\UploadedFile;

test('anyone can view book list and single book details', function () {
    $livro = Livro::factory()->create([
        'codigo_livro' => 'LIV-0100',
        'titulo' => 'Dom Casmurro',
        'autor' => 'Machado de Assis',
        'genero' => 'Literatura Brasileira',
        'data_lancamento' => '1899-01-01',
    ]);

    $this->getJson('/api/livros')
        ->assertOk()
        ->assertJsonFragment([
            'titulo' => 'Dom Casmurro',
            'codigo_livro' => 'LIV-0100',
            'data_lancamento' => '1899-01-01',
        ]);

    $this->getJson("/api/livros/{$livro->id_livro}")
        ->assertOk()
        ->assertJsonPath('autor', 'Machado de Assis')
        ->assertJsonPath('codigo_livro', 'LIV-0100');
});

test('preloading returns at most the 5 latest registered books ordered descending', function () {
    // Cadastra 7 livros em sequência
    $livros = [];
    for ($i = 1; $i <= 7; $i++) {
        $livros[] = Livro::factory()->create([
            'codigo_livro' => "LIV-000{$i}",
            'titulo' => "Livro Sequencial {$i}",
        ]);
    }

    // Sem filtro de busca (pré-carregamento), retorna no máximo 5 livros, ordenados pelos últimos cadastrados
    $response = $this->getJson('/api/livros');

    $response->assertOk()
        ->assertJsonCount(5)
        ->assertJsonPath('0.titulo', 'Livro Sequencial 7')
        ->assertJsonPath('4.titulo', 'Livro Sequencial 3')
        ->assertJsonMissing(['titulo' => 'Livro Sequencial 1'])
        ->assertJsonMissing(['titulo' => 'Livro Sequencial 2']);

    // Quando há filtro de pesquisa ativo, encontra livros em todo o acervo
    $this->getJson('/api/livros?q=Livro Sequencial 1')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'Livro Sequencial 1']);
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

test('aluno and professor only have read access and cannot create, update, delete or import books', function () {
    $aluno = User::factory()->create(['role' => 'aluno']);
    $professor = User::factory()->create(['role' => 'professor']);
    $livro = Livro::factory()->create();

    $csvFile = UploadedFile::fake()->createWithContent(
        'livros.csv',
        "titulo;editora;autor;genero;data_lancamento;codigo_livro\nVidas Secas;Record;Graciliano Ramos;Romance;1938-01-01;LIV-9001"
    );

    foreach ([$aluno, $professor] as $usuarioLeitura) {
        // Podem ler o acervo normalmente
        $this->actingAs($usuarioLeitura, 'sanctum')
            ->getJson('/api/livros')
            ->assertOk();

        // Bloqueados no cadastro manual
        $this->actingAs($usuarioLeitura, 'sanctum')
            ->postJson('/api/livros', [
                'titulo' => 'Livro Ilegal',
                'autor' => 'Nao Autorizado',
                'quantidade_total' => 1,
            ])
            ->assertForbidden();

        // Bloqueados na edição
        $this->actingAs($usuarioLeitura, 'sanctum')
            ->putJson("/api/livros/{$livro->id_livro}", [
                'titulo' => 'Tentativa Edição',
            ])
            ->assertForbidden();

        // Bloqueados na exclusão
        $this->actingAs($usuarioLeitura, 'sanctum')
            ->deleteJson("/api/livros/{$livro->id_livro}")
            ->assertForbidden();

        // Bloqueados na importação em massa via CSV
        $this->actingAs($usuarioLeitura, 'sanctum')
            ->postJson('/api/livros/importar-csv', [
                'arquivo' => $csvFile,
            ])
            ->assertForbidden();
    }
});

test('bibliotecaria, especialista and adm can create, update, delete and import books via csv', function () {
    $bibliotecaria = User::factory()->create(['role' => 'bibliotecaria']);
    $especialista = User::factory()->create(['role' => 'especialista']);

    // Bibliotecária cria livro
    $response = $this->actingAs($bibliotecaria, 'sanctum')
        ->postJson('/api/livros', [
            'codigo_livro' => 'LIV-2026',
            'titulo' => 'Capitães da Areia',
            'autor' => 'Jorge Amado',
            'editora' => 'Companhia das Letras',
            'genero' => 'Romance',
            'data_lancamento' => '1937-01-01',
            'prateleira_localizacao' => 'Corredor A, Estante 1',
            'quantidade_total' => 5,
        ]);

    $response->assertCreated()
        ->assertJsonPath('titulo', 'Capitães da Areia')
        ->assertJsonPath('codigo_livro', 'LIV-2026')
        ->assertJsonPath('data_lancamento', '1937-01-01')
        ->assertJsonPath('quantidade_disponivel', 5);

    $livroId = $response->json('id_livro');

    // Especialista atualiza livro
    $this->actingAs($especialista, 'sanctum')
        ->putJson("/api/livros/{$livroId}", [
            'titulo' => 'Capitães da Areia - Edição Especial',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Capitães da Areia - Edição Especial');

    // Especialista importa livros em massa via CSV
    $conteudoCsv = implode("\n", [
        'titulo;editora;autor;gênero;data de lançamento;código do livro',
        'Grande Sertão: Veredas;Nova Fronteira;João Guimarães Rosa;Romance;1956-05-01;LIV-3001',
        'A Hora da Estrela;Rocco;Clarice Lispector;Ficção;26/10/1977;LIV-3002',
    ]);

    $arquivoCsv = UploadedFile::fake()->createWithContent('acervo.csv', $conteudoCsv);

    $importResponse = $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/livros/importar-csv', [
            'arquivo' => $arquivoCsv,
        ]);

    $importResponse->assertCreated()
        ->assertJsonPath('total_importados', 2);

    $this->assertDatabaseHas('livros', [
        'codigo_livro' => 'LIV-3001',
        'titulo' => 'Grande Sertão: Veredas',
        'editora' => 'Nova Fronteira',
        'autor' => 'João Guimarães Rosa',
        'genero' => 'Romance',
    ]);

    $this->assertDatabaseHas('livros', [
        'codigo_livro' => 'LIV-3002',
        'titulo' => 'A Hora da Estrela',
        'editora' => 'Rocco',
        'autor' => 'Clarice Lispector',
    ]);

    // Bibliotecária exclui livro
    $this->actingAs($bibliotecaria, 'sanctum')
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
