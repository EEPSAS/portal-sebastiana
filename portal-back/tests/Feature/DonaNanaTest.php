<?php

use App\Models\DonaNanaConfig;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

test('exige autenticação para conversar com a Dona Nana ou acessar sua configuração', function () {
    $this->postJson('/api/dona-nana/chat', ['mensagem' => 'Olá'])->assertUnauthorized();
    $this->getJson('/api/dona-nana/config')->assertUnauthorized();
    $this->putJson('/api/dona-nana/config', [])->assertUnauthorized();
});

test('valida os campos obrigatórios da mensagem de chat', function () {
    $aluno = User::factory()->create(['role' => 'aluno']);

    // Mensagem vazia
    $this->actingAs($aluno, 'sanctum')
        ->postJson('/api/dona-nana/chat', ['mensagem' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['mensagem']);
});

test('retorna resposta acolhedora de fallback quando chave Gemini não está configurada', function () {
    Config::set('services.gemini.key', null);

    $aluno = User::factory()->create([
        'name' => 'Yasmin Teixeira',
        'nickname' => 'Yasmin',
        'role' => 'aluno',
    ]);

    $response = $this->actingAs($aluno, 'sanctum')
        ->postJson('/api/dona-nana/chat', [
            'mensagem' => 'Olá Dona Nana, como vejo minhas notas?',
            'contexto_origem' => 'balao',
        ])
        ->assertOk()
        ->assertJsonStructure([
            'resposta',
            'sugestoes',
            'autor',
            'origem',
            'timestamp',
        ]);

    expect($response->json('autor'))->toBe('Professora Sebastiana (Dona Nana)')
        ->and($response->json('origem'))->toBe('fallback-local')
        ->and($response->json('resposta'))->toContain('Yasmin');
});

test('retorna resposta simulada do Gemini 3.8 Flash quando chave está configurada', function () {
    Config::set('services.gemini.key', 'fake-gemini-key');
    Config::set('services.gemini.model', 'gemini-3.8-flash');

    Http::fake([
        'https://generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => 'Olá, meu querido! Que bom ver você estudando com tanto afinco. O boletim fica na aba Boletim!'],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $aluno = User::factory()->create([
        'name' => 'Carlos Silva',
        'role' => 'aluno',
    ]);

    $response = $this->actingAs($aluno, 'sanctum')
        ->postJson('/api/dona-nana/chat', [
            'mensagem' => 'Como eu vejo o boletim?',
            'historico' => [
                ['role' => 'user', 'text' => 'Bom dia Dona Nana'],
                ['role' => 'model', 'text' => 'Bom dia, meu filho!'],
            ],
            'contexto_origem' => 'aba',
        ])
        ->assertOk();

    expect($response->json('resposta'))->toContain('O boletim fica na aba Boletim!')
        ->and($response->json('origem'))->toBe('gemini-3.8-flash');
});

test('bloqueia acesso de alunos e professores à configuração da persona', function () {
    $aluno = User::factory()->create(['role' => 'aluno']);
    $professor = User::factory()->create(['role' => 'professor']);

    $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/dona-nana/config')
        ->assertForbidden();

    $this->actingAs($professor, 'sanctum')
        ->getJson('/api/dona-nana/config')
        ->assertForbidden();
});

test('permite que Especialista e Administrador consultem e atualizem os 4 campos da persona', function () {
    $especialista = User::factory()->create(['role' => 'especialista']);
    $admin = User::factory()->create(['role' => 'adm']);

    // Especialista obtém configuração atual
    $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/dona-nana/config')
        ->assertOk()
        ->assertJsonStructure([
            'id',
            'personalidade',
            'conhecimento_portal',
            'historias_causos',
            'diretrizes_resposta',
            'avatar_url',
            'prompt_montado',
        ]);

    // Admin atualiza os 4 campos da persona
    $novosDados = [
        'personalidade' => 'Dona Nana é a professora mais carinhosa e doce de todo o estado de Minas Gerais.',
        'conhecimento_portal' => 'Instrua os alunos a consultarem o boletim após cada bimestre e cuidarem bem dos livros.',
        'historias_causos' => 'A escola foi erguida com a união dos moradores de Jaguaraçu nos anos 60.',
        'diretrizes_resposta' => 'Seja sempre acolhedora, cite provérbios e encoraje o amor aos livros.',
        'avatar_url' => '/img/escola-professora.jpeg',
    ];

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/dona-nana/config', $novosDados)
        ->assertOk()
        ->assertJsonPath('personalidade', $novosDados['personalidade']);

    $configAtualizada = DonaNanaConfig::obterAtiva();
    expect($configAtualizada->personalidade)->toBe($novosDados['personalidade']);
});
