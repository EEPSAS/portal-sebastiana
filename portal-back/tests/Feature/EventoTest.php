<?php

use App\Enums\TipoEvento;
use App\Models\Evento;
use App\Models\User;

test('unauthenticated users cannot access calendar routes', function () {
    $this->getJson('/api/eventos')->assertUnauthorized();
    $this->getJson('/api/eventos/datas-importantes')->assertUnauthorized();
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

    // 1. Usuário padrão cria seu próprio evento pessoal
    $respCreate = $this->actingAs($user, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Meu Lembrete de Estudos',
            'data_inicio' => '2026-10-20',
            'hora_inicio' => '14:00',
            'hora_fim' => '16:00',
            'tipo' => 'Provas e Trabalhos',
            'importante' => true, // Mesmo enviando true, deve ser forçado para false para usuário comum
        ]);

    $respCreate->assertCreated()
        ->assertJsonPath('titulo', 'Meu Lembrete de Estudos')
        ->assertJsonPath('tipo', TipoEvento::PROVAS_E_TRABALHOS->value)
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
            'titulo' => 'Meu Lembrete Atualizado',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Meu Lembrete Atualizado');

    // 6. NÃO pode atualizar evento do especialista nem de outro aluno
    $this->actingAs($user, 'sanctum')
        ->putJson("/api/eventos/{$eventoEspecialista->id}", [
            'titulo' => 'Tentativa de Alterar Evento da Escola',
        ])
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/eventos/{$eventoOutroAluno->id}", [
            'titulo' => 'Tentativa de Alterar Evento de Outro Colega',
        ])
        ->assertForbidden();

    // 7. Pode excluir seu próprio evento
    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/eventos/{$meuEventoId}")
        ->assertNoContent();

    expect(Evento::find($meuEventoId))->toBeNull();

    // 8. NÃO pode excluir evento do especialista
    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoEspecialista->id}")
        ->assertForbidden();

    expect(Evento::find($eventoEspecialista->id))->not->toBeNull();
});

test('especialista can create, update, delete and view events', function () {
    $especialista = User::factory()->especialista()->create();

    // Create event
    $createResponse = $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Reunião de Pais e Mestres',
            'descricao' => 'Alinhamento pedagógico do 3º bimestre',
            'data_inicio' => '2026-10-15',
            'hora_inicio' => '19:00',
            'hora_fim' => '21:00',
            'tipo' => 'Eventos',
            'importante' => true,
            'local' => 'Auditório',
            'cor' => '#007bff',
        ]);

    $createResponse->assertCreated()
        ->assertJsonPath('titulo', 'Reunião de Pais e Mestres')
        ->assertJsonPath('importante', true)
        ->assertJsonPath('tipo', TipoEvento::EVENTOS->value)
        ->assertJsonPath('criador.id', $especialista->id);

    $eventoId = $createResponse->json('id');

    // Update event
    $this->actingAs($especialista, 'sanctum')
        ->putJson("/api/eventos/{$eventoId}", [
            'titulo' => 'Reunião Geral de Pais',
            'local' => 'Quadra Coberta',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Reunião Geral de Pais')
        ->assertJsonPath('local', 'Quadra Coberta');

    // Delete event
    $this->actingAs($especialista, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoId}")
        ->assertNoContent();

    expect(Evento::find($eventoId))->toBeNull();
});

test('administrator has full access to calendar operations', function () {
    $admin = User::factory()->adm()->create();
    $evento = Evento::factory()->create();

    // Admin can update
    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/eventos/{$evento->id}", [
            'titulo' => 'Modificado pelo Admin',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Modificado pelo Admin');

    // Admin can delete
    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/eventos/{$evento->id}")
        ->assertNoContent();

    expect(Evento::find($evento->id))->toBeNull();
});

test('validates required fields and formats when creating events', function () {
    $admin = User::factory()->adm()->create();

    // Missing title and start date
    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['titulo', 'data_inicio']);

    // Invalid time format
    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Gincana Escolar',
            'data_inicio' => '2026-11-20',
            'hora_inicio' => '25:99',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['hora_inicio']);

    // Invalid enum type
    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Evento Inválido',
            'data_inicio' => '2026-11-20',
            'tipo' => 'tipo_completamente_invalido',
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
            'dia_inteiro' => null,
            'importante' => null,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tipo', 'dia_inteiro', 'importante']);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Evento com campos opcionais vazios',
            'descricao' => null,
            'data_inicio' => '2026-11-20',
            'data_fim' => null,
            'hora_inicio' => null,
            'hora_fim' => null,
            'dia_inteiro' => false,
            'tipo' => 'evento',
            'importante' => false,
            'local' => null,
            'cor' => null,
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
            'dia_inteiro' => null,
            'importante' => null,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['tipo', 'dia_inteiro', 'importante']);

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
        'Datas Comemorativas' => TipoEvento::DATAS_COMEMORATIVAS->value,
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

    $respLooseFeriado = $this->actingAs($admin, 'sanctum')->postJson('/api/eventos', [
        'titulo' => 'Teste Loose Feriado',
        'data_inicio' => '2026-11-27',
        'tipo' => 'feriado',
    ]);
    $respLooseFeriado->assertCreated()
        ->assertJsonPath('tipo', TipoEvento::FERIADOS_E_RECESSOS->value);
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
        'tipo' => TipoEvento::DATAS_COMEMORATIVAS,
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
