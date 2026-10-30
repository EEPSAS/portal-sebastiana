<?php

use App\Enums\TipoEvento;
use App\Models\Evento;
use App\Models\User;
use App\Notifications\NotificacaoPortal;
use Illuminate\Support\Facades\Notification;

test('unauthenticated users can read institutional calendar events but cannot see private events or mutate', function () {
    $especialista = User::factory()->especialista()->create();
    $aluno = User::factory()->padrao()->create();

    Evento::factory()->importante()->create([
        'titulo' => 'Feira Pedagógica Institucional',
        'criador_id' => $especialista->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    Evento::factory()->create([
        'titulo' => 'Lembrete Privado do Aluno',
        'criador_id' => $aluno->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    // Visitante público acessa GET /api/eventos e vê apenas o evento do Especialista
    $this->getJson('/api/eventos')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'Feira Pedagógica Institucional'])
        ->assertJsonMissing(['titulo' => 'Lembrete Privado do Aluno']);

    // Visitante público acessa GET /api/eventos/datas-importantes e vê apenas o evento do Especialista
    $this->getJson('/api/eventos/datas-importantes')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'Feira Pedagógica Institucional'])
        ->assertJsonMissing(['titulo' => 'Lembrete Privado do Aluno']);

    // Visitante não autenticado não pode criar eventos
    $this->postJson('/api/eventos', [])->assertUnauthorized();
});

test('standard user can create personal events and manage only their own', function () {
    $user = User::factory()->padrao()->create();
    $especialista = User::factory()->especialista()->create();
    $outroUser = User::factory()->padrao()->create();

    $eventoEspecialista = Evento::factory()->create([
        'titulo' => 'Semana Cultural',
        'criador_id' => $especialista->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    $eventoOutroAluno = Evento::factory()->create([
        'titulo' => 'Estudo em Grupo do Colega',
        'criador_id' => $outroUser->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    // Tentativa de criar evento restrito (Provas e Trabalhos) por usuário comum deve falhar (422)
    $this->actingAs($user, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Prova Simulada Indevida',
            'data_inicio' => '2026-10-20',
            'tipo' => 'Provas e Trabalhos',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tipo']);

    // 1. Usuário padrão cria seu próprio evento pessoal permitido (tipo Eventos)
    $respCreate = $this->actingAs($user, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Meu Lembrete de Estudos',
            'data_inicio' => '2026-10-20',
            'hora_inicio' => '14:00',
            'tipo' => 'Eventos',
            'importante' => true, // Forçado para false para usuário comum
        ]);

    $respCreate->assertCreated()
        ->assertJsonPath('titulo', 'Meu Lembrete de Estudos')
        ->assertJsonPath('tipo', TipoEvento::EVENTOS->value)
        ->assertJsonPath('importante', false)
        ->assertJsonPath('criador.id', $user->id);

    $meuEventoId = $respCreate->json('id');

    // 2. Na listagem, vê o próprio evento e o do especialista, mas NÃO o do outro aluno
    $listResp = $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos')
        ->assertOk();

    $listResp->assertJsonFragment(['titulo' => 'Meu Lembrete de Estudos']);
    $listResp->assertJsonFragment(['titulo' => 'Semana Cultural']);
    $listResp->assertJsonMissing(['titulo' => 'Estudo em Grupo do Colega']);

    // 3. Pode visualizar detalhe do próprio evento e do especialista
    $this->actingAs($user, 'sanctum')
        ->getJson("/api/eventos/{$meuEventoId}")
        ->assertOk()
        ->assertJsonPath('titulo', 'Meu Lembrete de Estudos');

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/eventos/{$eventoEspecialista->id}")
        ->assertOk()
        ->assertJsonPath('titulo', 'Semana Cultural');

    // 4. NÃO pode visualizar detalhe do evento privado de outro usuário padrão
    $this->actingAs($user, 'sanctum')
        ->getJson("/api/eventos/{$eventoOutroAluno->id}")
        ->assertForbidden();

    // 5. Pode atualizar o próprio evento
    $this->actingAs($user, 'sanctum')
        ->putJson("/api/eventos/{$meuEventoId}", [
            'titulo' => 'Lembrete de Estudos Atualizado',
            'data_inicio' => '2026-10-20',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Lembrete de Estudos Atualizado');

    // 6. NÃO pode atualizar evento de terceiros
    $this->actingAs($user, 'sanctum')
        ->putJson("/api/eventos/{$eventoEspecialista->id}", [
            'titulo' => 'Tentativa de Hacker no Evento',
        ])
        ->assertForbidden();

    // 7. Pode excluir o próprio evento
    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/eventos/{$meuEventoId}")
        ->assertNoContent();

    // 8. NÃO pode excluir evento do Especialista
    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoEspecialista->id}")
        ->assertForbidden();
});

test('professor events are shared with authenticated users but remain private to public visitors', function () {
    $professor = User::factory()->professor()->create();
    $aluno = User::factory()->padrao()->create();

    $eventoProfessor = Evento::factory()->create([
        'titulo' => 'Plantão de Dúvidas de Física',
        'criador_id' => $professor->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    // Visitante público NÃO enxerga evento de professor
    $this->getJson('/api/eventos')
        ->assertOk()
        ->assertJsonMissing(['titulo' => 'Plantão de Dúvidas de Física']);

    // Aluno logado enxerga o evento compartilhado do professor
    $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/eventos')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'Plantão de Dúvidas de Física']);

    // Aluno logado pode ver os detalhes do evento do professor
    $this->actingAs($aluno, 'sanctum')
        ->getJson("/api/eventos/{$eventoProfessor->id}")
        ->assertOk();

    // Aluno logado NÃO pode editar nem excluir evento do professor
    $this->actingAs($aluno, 'sanctum')
        ->putJson("/api/eventos/{$eventoProfessor->id}", ['titulo' => 'Invasão'])
        ->assertForbidden();

    $this->actingAs($aluno, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoProfessor->id}")
        ->assertForbidden();
});

test('especialista can create, update, delete and view events', function () {
    $especialista = User::factory()->especialista()->create();
    $aluno = User::factory()->padrao()->create();

    $eventoAluno = Evento::factory()->create([
        'titulo' => 'Tarefa Particular do Estudante',
        'criador_id' => $aluno->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    // 1. Especialista cria evento institucional com Prova e destaque
    $respCreate = $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Avaliação Diagnóstica de Matemática',
            'descricao' => 'Aplicação geral para os anos finais.',
            'data_inicio' => '2026-11-10',
            'tipo' => 'Provas e Trabalhos',
            'importante' => true,
            'local' => 'Bloco B',
        ]);

    $respCreate->assertCreated()
        ->assertJsonPath('titulo', 'Avaliação Diagnóstica de Matemática')
        ->assertJsonPath('tipo', TipoEvento::PROVAS_E_TRABALHOS->value)
        ->assertJsonPath('importante', true);

    $eventoId = $respCreate->json('id');

    // 2. Especialista tem autoridade de gestão e pode editar evento institucional e de outros usuários
    $this->actingAs($especialista, 'sanctum')
        ->putJson("/api/eventos/{$eventoId}", [
            'titulo' => 'Avaliação Diagnóstica de Matemática (Remarcada)',
            'data_inicio' => '2026-11-12',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Avaliação Diagnóstica de Matemática (Remarcada)');

    // 3. Especialista pode excluir
    $this->actingAs($especialista, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoId}")
        ->assertNoContent();
});

test('administrator has full access to calendar operations', function () {
    $admin = User::factory()->adm()->create();
    $aluno = User::factory()->padrao()->create();

    $eventoAluno = Evento::factory()->create([
        'titulo' => 'Estudo Individual Aluno',
        'criador_id' => $aluno->id,
        'tipo' => TipoEvento::EVENTOS,
    ]);

    // 1. Adm cria Sábado Letivo institucional
    $resp = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Sábado Letivo Temático',
            'data_inicio' => '2026-11-14',
            'tipo' => 'Sábados Letivos',
            'importante' => true,
        ]);

    $resp->assertCreated()
        ->assertJsonPath('tipo', TipoEvento::SABADO_LETIVO->value)
        ->assertJsonPath('importante', true);

    $eventoAdminId = $resp->json('id');

    // 2. Adm pode editar e excluir qualquer evento
    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/eventos/{$eventoAluno->id}", [
            'titulo' => 'Estudo Individual Moderado pelo Admin',
        ])
        ->assertOk();

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoAluno->id}")
        ->assertNoContent();
});

test('validates required fields and formats when creating events', function () {
    $especialista = User::factory()->especialista()->create();

    // Rejeita payload vazio
    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['titulo', 'data_inicio']);

    // Rejeita formato de data inválido
    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Evento Inválido',
            'data_inicio' => '10/11/2026',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['data_inicio']);

    // Rejeita data_fim anterior à data_inicio
    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Período Impossível',
            'data_inicio' => '2026-11-10',
            'data_fim' => '2026-11-05',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['data_fim']);

    // Rejeita formato de hora inválido
    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Hora Errada',
            'data_inicio' => '2026-11-10',
            'hora_inicio' => '25:99',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['hora_inicio']);

    // Rejeita tipo inválido
    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Tipo Inválido',
            'data_inicio' => '2026-11-10',
            'tipo' => 'TipoQueNaoExisteNoSistema',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tipo']);
});

test('validates event fields against database nullability and date constraints', function () {
    $admin = User::factory()->adm()->create();

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Evento com nulos inválidos',
            'data_inicio' => '2026-11-20',
            'tipo' => null,
            'importante' => null,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tipo', 'importante']);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Evento com campos opcionais vazios',
            'descricao' => null,
            'data_inicio' => '2026-11-20',
            'data_fim' => null,
            'hora_inicio' => null,
            'tipo' => 'evento',
            'importante' => false,
            'local' => null,
        ])
        ->assertCreated();

    $evento = Evento::factory()->create([
        'criador_id' => $admin->id,
        'data_inicio' => '2026-11-20',
        'data_fim' => '2026-11-22',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/eventos/{$evento->id}", [
            'tipo' => null,
            'importante' => null,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tipo', 'importante']);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/eventos/{$evento->id}", [
            'data_inicio' => '2026-11-23',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['data_inicio']);
});

test('validates and accepts all TipoEvento enum options and normalizes loose values', function () {
    $admin = User::factory()->adm()->create();

    $opcoesValidas = [
        'Eventos' => TipoEvento::EVENTOS->value,
        'Provas e Trabalhos' => TipoEvento::PROVAS_E_TRABALHOS->value,
        'Sábados Letivos' => TipoEvento::SABADO_LETIVO->value,
        'Feriados e Recessos' => TipoEvento::FERIADOS_E_RECESSOS->value,
    ];

    foreach ($opcoesValidas as $entrada => $esperado) {
        $resp = $this->actingAs($admin, 'sanctum')->postJson('/api/eventos', [
            'titulo' => "Teste de Tipo {$entrada}",
            'data_inicio' => '2026-11-25',
            'tipo' => $entrada,
        ]);

        $resp->assertCreated()
            ->assertJsonPath('tipo', $esperado);
    }

    // Normalização loose (slug ou texto alternativo amigável)
    $respLoose = $this->actingAs($admin, 'sanctum')->postJson('/api/eventos', [
        'titulo' => 'Teste Loose Provas',
        'data_inicio' => '2026-11-26',
        'tipo' => 'provas',
    ]);
    $respLoose->assertCreated()
        ->assertJsonPath('tipo', TipoEvento::PROVAS_E_TRABALHOS->value);

    $respLooseSabado = $this->actingAs($admin, 'sanctum')->postJson('/api/eventos', [
        'titulo' => 'Teste Loose Sábado',
        'data_inicio' => '2026-11-27',
        'tipo' => 'sabados_letivos',
    ]);
    $respLooseSabado->assertCreated()
        ->assertJsonPath('tipo', TipoEvento::SABADO_LETIVO->value);

    $respLooseFeriado = $this->actingAs($admin, 'sanctum')->postJson('/api/eventos', [
        'titulo' => 'Teste Loose Feriado',
        'data_inicio' => '2026-11-28',
        'tipo' => 'feriado',
    ]);
    $respLooseFeriado->assertCreated()
        ->assertJsonPath('tipo', TipoEvento::FERIADOS_E_RECESSOS->value);

    $respLooseReuniao = $this->actingAs($admin, 'sanctum')->postJson('/api/eventos', [
        'titulo' => 'Teste Loose Reunião',
        'data_inicio' => '2026-11-29',
        'tipo' => 'reuniao',
    ]);
    $respLooseReuniao->assertCreated()
        ->assertJsonPath('tipo', TipoEvento::EVENTOS->value);
});

test('can filter calendar events by month, year, type and fetch important dates', function () {
    $user = User::factory()->padrao()->create();
    $especialista = User::factory()->especialista()->create();

    // Eventos normais
    Evento::factory()->create([
        'titulo' => 'Feira de Ciências',
        'data_inicio' => '2026-08-28',
        'tipo' => TipoEvento::EVENTOS,
        'importante' => false,
        'criador_id' => $especialista->id,
    ]);

    Evento::factory()->create([
        'titulo' => 'Semana de Avaliações',
        'data_inicio' => '2026-08-15',
        'tipo' => TipoEvento::PROVAS_E_TRABALHOS,
        'importante' => false,
        'criador_id' => $especialista->id,
    ]);

    // Data importante
    Evento::factory()->importante()->create([
        'titulo' => 'Início do Ano Letivo',
        'data_inicio' => '2026-02-05',
        'tipo' => TipoEvento::EVENTOS,
        'criador_id' => $especialista->id,
    ]);

    // Filter by month and year
    $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos?mes=8&ano=2026')
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonFragment(['titulo' => 'Feira de Ciências'])
        ->assertJsonFragment(['titulo' => 'Semana de Avaliações']);

    // Filter by tipo enum
    $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos?mes=8&ano=2026&tipo=Provas e Trabalhos')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['titulo' => 'Semana de Avaliações'])
        ->assertJsonMissing(['titulo' => 'Feira de Ciências']);

    // Fetch important dates endpoint
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos/datas-importantes')
        ->assertOk();

    $response->assertJsonFragment(['titulo' => 'Início do Ano Letivo']);
    $response->assertJsonMissing(['titulo' => 'Feira de Ciências']);
});

test('gestor can batch store events and standard users are blocked', function () {
    $especialista = User::factory()->especialista()->create();
    $aluno = User::factory()->padrao()->create();

    $payload = [
        'eventos' => [
            [
                'data' => '2026-03-14',
                'titulo' => 'Sábado Letivo 1',
                'categoria' => 'Sábados Letivos',
                'descricao' => 'Reposição de aulas de História e Geografia.',
            ],
            [
                'data' => '2026-04-21',
                'titulo' => 'Tiradentes',
                'categoria' => 'Feriados e Recessos',
                'descricao' => 'Feriado nacional de Tiradentes.',
            ],
        ],
    ];

    // Aluno é barrado com 403
    $this->actingAs($aluno, 'sanctum')
        ->postJson('/api/eventos/em-massa', $payload)
        ->assertForbidden();

    // Especialista cria ambos com sucesso (201)
    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos/em-massa', $payload)
        ->assertCreated()
        ->assertJsonCount(2)
        ->assertJsonFragment(['titulo' => 'Sábado Letivo 1', 'tipo' => TipoEvento::SABADO_LETIVO->value])
        ->assertJsonFragment(['titulo' => 'Tiradentes', 'tipo' => TipoEvento::FERIADOS_E_RECESSOS->value]);
});

test('marcar evento importante dispara notificacao super importante para usuarios ativos', function () {
    Notification::fake();

    $especialista = User::factory()->especialista()->create();
    $usuarioAtivo = User::factory()->padrao()->create(['ativo' => true]);
    $usuarioInativo = User::factory()->padrao()->create(['ativo' => false]);

    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Encontro Pedagógico Fundamental',
            'descricao' => 'Comparecimento obrigatório.',
            'data_inicio' => '2026-12-01',
            'tipo' => 'Eventos',
            'importante' => true,
        ])
        ->assertCreated();

    Notification::assertSentTo(
        [$usuarioAtivo],
        NotificacaoPortal::class,
        function (NotificacaoPortal $notification) {
            $data = $notification->toDatabase(new User);

            return $data['prioridade'] === 'super_importante'
                && str_contains($data['titulo'], 'Encontro Pedagógico Fundamental');
        }
    );

    Notification::assertNotSentTo([$usuarioInativo], NotificacaoPortal::class);
});

test('cadastro em massa aceita a chave interna sabados e grava apenas a categoria informada', function () {
    $especialista = User::factory()->especialista()->create();

    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos/em-massa', ['eventos' => [
            ['data' => '2026-03-14', 'titulo' => 'Sabado A', 'categoria' => 'sabados', 'descricao' => 'Reposicao'],
            ['data' => '2026-03-21', 'titulo' => 'Recesso B', 'categoria' => 'feriados', 'descricao' => 'Recesso'],
        ]])
        ->assertCreated();

    expect(Evento::where('titulo', 'Sabado A')->first()->tipo)->toBe(TipoEvento::SABADO_LETIVO);
    expect(Evento::where('titulo', 'Recesso B')->first()->tipo)->toBe(TipoEvento::FERIADOS_E_RECESSOS);
});
