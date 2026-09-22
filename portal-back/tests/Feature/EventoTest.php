<?php

use App\Models\Evento;
use App\Models\User;

test('unauthenticated users cannot access calendar routes', function () {
    $this->getJson('/api/eventos')->assertUnauthorized();
    $this->getJson('/api/eventos/datas-importantes')->assertUnauthorized();
    $this->postJson('/api/eventos', [])->assertUnauthorized();
});

test('standard user (padrao) can only view events and cannot modify them', function () {
    $user = User::factory()->padrao()->create();
    $evento = Evento::factory()->create(['titulo' => 'Evento Original']);

    // Can list
    $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos')
        ->assertOk()
        ->assertJsonFragment(['titulo' => 'Evento Original']);

    // Can view single
    $this->actingAs($user, 'sanctum')
        ->getJson("/api/eventos/{$evento->id}")
        ->assertOk()
        ->assertJsonPath('titulo', 'Evento Original');

    // Cannot create
    $this->actingAs($user, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Tentativa Não Autorizada',
            'data_inicio' => '2026-10-01',
        ])
        ->assertForbidden();

    // Cannot update
    $this->actingAs($user, 'sanctum')
        ->putJson("/api/eventos/{$evento->id}", [
            'titulo' => 'Atualização Não Autorizada',
        ])
        ->assertForbidden();

    // Cannot delete
    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/eventos/{$evento->id}")
        ->assertForbidden();

    expect(Evento::find($evento->id))->not->toBeNull();
});

test('editor can create, update, delete and view events', function () {
    $editor = User::factory()->editor()->create();

    // Create event
    $createResponse = $this->actingAs($editor, 'sanctum')
        ->postJson('/api/eventos', [
            'titulo' => 'Reunião de Pais e Mestres',
            'descricao' => 'Alinhamento pedagógico do 3º bimestre',
            'data_inicio' => '2026-10-15',
            'hora_inicio' => '19:00',
            'hora_fim' => '21:00',
            'tipo' => 'reuniao',
            'importante' => true,
            'local' => 'Auditório',
            'cor' => '#007bff',
        ]);

    $createResponse->assertCreated()
        ->assertJsonPath('titulo', 'Reunião de Pais e Mestres')
        ->assertJsonPath('importante', true)
        ->assertJsonPath('criador.id', $editor->id);

    $eventoId = $createResponse->json('id');

    // Update event
    $this->actingAs($editor, 'sanctum')
        ->putJson("/api/eventos/{$eventoId}", [
            'titulo' => 'Reunião Geral de Pais',
            'local' => 'Quadra Coberta',
        ])
        ->assertOk()
        ->assertJsonPath('titulo', 'Reunião Geral de Pais')
        ->assertJsonPath('local', 'Quadra Coberta');

    // Delete event
    $this->actingAs($editor, 'sanctum')
        ->deleteJson("/api/eventos/{$eventoId}")
        ->assertNoContent();

    expect(Evento::find($eventoId))->toBeNull();
});

test('administrator has full access to calendar operations', function () {
    $admin = User::factory()->administrador()->create();
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
    $admin = User::factory()->administrador()->create();

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
});

test('can filter calendar events and fetch important dates', function () {
    $user = User::factory()->padrao()->create();

    // Eventos normais
    Evento::factory()->create([
        'titulo' => 'Feira de Ciências',
        'data_inicio' => '2026-08-28',
        'tipo' => 'evento',
        'importante' => false,
    ]);

    // Data importante
    Evento::factory()->importante()->create([
        'titulo' => 'Início do Ano Letivo',
        'data_inicio' => '2026-02-05',
        'tipo' => 'data_importante',
    ]);

    // Filter by month and year
    $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos?mes=8&ano=2026')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['titulo' => 'Feira de Ciências']);

    // Fetch important dates endpoint
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/eventos/datas-importantes')
        ->assertOk();

    $response->assertJsonFragment(['titulo' => 'Início do Ano Letivo']);
    $response->assertJsonMissing(['titulo' => 'Feira de Ciências']);
});
