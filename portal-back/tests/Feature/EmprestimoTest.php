<?php

use App\Enums\EmprestimoStatus;
use App\Models\Emprestimo;
use App\Models\Livro;
use App\Models\User;
use Carbon\Carbon;

test('authenticated user can request a book loan', function () {
    $user = User::factory()->create(['role' => 'padrao']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 2]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', [
            'livro_id' => $livro->id_livro,
            'observacoes' => 'Preciso para trabalho escolar',
        ]);

    $response->assertCreated()
        ->assertJsonPath('status', 'solicitado')
        ->assertJsonPath('usuario.id', $user->id)
        ->assertJsonPath('livro.id_livro', $livro->id_livro);

    expect(Emprestimo::where('usuario_id', $user->id)->count())->toBe(1);
});

test('cannot request an unavailable book or duplicate active request', function () {
    $user = User::factory()->create(['role' => 'padrao']);
    $livroEsgotado = Livro::factory()->indisponivel()->create();
    $livroNormal = Livro::factory()->create(['quantidade_disponivel' => 1]);

    // Request unavailable book
    $this->actingAs($user, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', [
            'livro_id' => $livroEsgotado->id_livro,
        ])
        ->assertUnprocessable();

    // First request ok
    $this->actingAs($user, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', [
            'livro_id' => $livroNormal->id_livro,
        ])
        ->assertCreated();

    // Duplicate request
    $this->actingAs($user, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', [
            'livro_id' => $livroNormal->id_livro,
        ])
        ->assertUnprocessable();
});

test('admin can approve loan which decrements available book quantity', function () {
    $adm = User::factory()->create(['role' => 'adm']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 3]);
    $emprestimo = Emprestimo::factory()->solicitado()->create([
        'livro_id' => $livro->id_livro,
    ]);

    $response = $this->actingAs($adm, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/aprovar");

    $response->assertOk()
        ->assertJsonPath('status', 'aprovado')
        ->assertJsonPath('data_prevista_devolucao', fn ($date) => ! is_null($date));

    expect($livro->fresh()->quantidade_disponivel)->toBe(2);
});

test('standard user cannot approve or register return', function () {
    $user = User::factory()->create(['role' => 'padrao']);
    $emprestimo = Emprestimo::factory()->solicitado()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/aprovar")
        ->assertForbidden();

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/devolver")
        ->assertForbidden();
});

test('user can renew their active loan extending the return deadline', function () {
    $user = User::factory()->create(['role' => 'padrao']);
    $dataInicial = now()->addDays(5);
    $emprestimo = Emprestimo::factory()->create([
        'usuario_id' => $user->id,
        'status' => EmprestimoStatus::APROVADO,
        'data_prevista_devolucao' => $dataInicial,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/renovar");

    $response->assertOk()
        ->assertJsonPath('status', 'renovado');

    $novaData = Carbon::parse($response->json('data_prevista_devolucao'));
    expect($novaData->greaterThan($dataInicial))->toBeTrue();
});

test('registering return updates status to devolvido and increments book quantity', function () {
    $especialista = User::factory()->create(['role' => 'especialista']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 1]);
    $emprestimo = Emprestimo::factory()->create([
        'livro_id' => $livro->id_livro,
        'status' => EmprestimoStatus::APROVADO,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/devolver");

    $response->assertOk()
        ->assertJsonPath('status', 'devolvido')
        ->assertJsonPath('data_devolucao_real', fn ($val) => ! is_null($val));

    expect($livro->fresh()->quantidade_disponivel)->toBe(2);
});

test('admin can manually update loan status', function () {
    $adm = User::factory()->create(['role' => 'adm']);
    $emprestimo = Emprestimo::factory()->solicitado()->create();

    $response = $this->actingAs($adm, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/status", [
            'status' => 'recusado',
            'observacoes' => 'Exemplar danificado no acervo',
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'recusado');
});

test('user views only their loans whereas admin views all loans', function () {
    $user1 = User::factory()->create(['role' => 'padrao']);
    $user2 = User::factory()->create(['role' => 'padrao']);
    $adm = User::factory()->create(['role' => 'adm']);

    Emprestimo::factory()->create(['usuario_id' => $user1->id]);
    Emprestimo::factory()->create(['usuario_id' => $user2->id]);

    // User 1 sees only 1
    $this->actingAs($user1, 'sanctum')
        ->getJson('/api/emprestimos')
        ->assertOk()
        ->assertJsonCount(1);

    // Endpoint meus-emprestimos
    $this->actingAs($user1, 'sanctum')
        ->getJson('/api/emprestimos/meus-emprestimos')
        ->assertOk()
        ->assertJsonCount(1);

    // Admin sees all 2
    $this->actingAs($adm, 'sanctum')
        ->getJson('/api/emprestimos')
        ->assertOk()
        ->assertJsonCount(2);
});
