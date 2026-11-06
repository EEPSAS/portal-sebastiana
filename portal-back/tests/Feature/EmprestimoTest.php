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
    expect($livro->fresh()->quantidade_disponivel)->toBe(1);
});

test('requesting the last available book makes it unavailable for others', function () {
    $aluno1 = User::factory()->create(['role' => 'padrao']);
    $aluno2 = User::factory()->create(['role' => 'padrao']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 1]);

    // Aluno 1 solicita o único exemplar
    $this->actingAs($aluno1, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', [
            'livro_id' => $livro->id_livro,
        ])
        ->assertCreated();

    // O livro passa a ficar indisponível para outros alunos
    expect($livro->fresh()->quantidade_disponivel)->toBe(0);
    expect($livro->fresh()->verificarDisponibilidade())->toBeFalse();

    // Aluno 2 tenta solicitar o mesmo livro e recebe erro 422
    $this->actingAs($aluno2, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', [
            'livro_id' => $livro->id_livro,
        ])
        ->assertUnprocessable();
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

test('admin can mark a loan as delivered without decrementing an already reserved copy twice', function () {
    $adm = User::factory()->create(['role' => 'adm']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 3]);
    $emprestimo = Emprestimo::factory()->solicitado()->create([
        'livro_id' => $livro->id_livro,
        'reserva_ativa' => true,
    ]);

    $response = $this->actingAs($adm, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/entregar");

    $response->assertOk()
        ->assertJsonPath('status', 'entregue')
        ->assertJsonPath('data_emprestimo', fn ($date) => ! is_null($date))
        ->assertJsonPath('data_prevista_devolucao', fn ($date) => ! is_null($date));

    expect($livro->fresh()->quantidade_disponivel)->toBe(3);
});

test('standard user cannot deliver or register return', function () {
    $user = User::factory()->create(['role' => 'padrao']);
    $emprestimo = Emprestimo::factory()->solicitado()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/entregar")
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
        'status' => EmprestimoStatus::ENTREGUE,
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
        'status' => EmprestimoStatus::ENTREGUE,
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

test('requesting a book reserves stock without starting loan timer and notifies the librarian', function () {
    $aluno = User::factory()->aluno()->create();
    $bibliotecaria = User::factory()->create(['role' => 'bibliotecaria']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 1]);

    $this->actingAs($aluno, 'sanctum')
        ->postJson('/api/emprestimos/solicitar', ['livro_id' => $livro->id_livro])
        ->assertCreated()
        ->assertJsonPath('status', 'solicitado')
        ->assertJsonPath('data_emprestimo', null)
        ->assertJsonPath('data_prevista_devolucao', null)
        ->assertJsonPath('livro.titulo', $livro->titulo);

    expect($livro->fresh()->quantidade_disponivel)->toBe(0)
        ->and($bibliotecaria->notifications()->count())->toBe(1)
        ->and($bibliotecaria->notifications()->first()->data['prioridade'])->toBe('importante')
        ->and($bibliotecaria->notifications()->first()->data['assunto'])
        ->toContain($aluno->name, $livro->titulo);
});

test('student can cancel only their pending loan and restore the reserved copy', function () {
    $aluno = User::factory()->aluno()->create();
    $outroAluno = User::factory()->aluno()->create();
    $livro = Livro::factory()->create(['quantidade_disponivel' => 0]);
    $emprestimo = Emprestimo::factory()->solicitado()->create([
        'livro_id' => $livro->id_livro,
        'usuario_id' => $aluno->id,
        'reserva_ativa' => true,
    ]);

    $this->actingAs($outroAluno, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/cancelar")
        ->assertForbidden();

    $this->actingAs($aluno, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/cancelar")
        ->assertOk()
        ->assertJsonPath('status', 'recusado');

    expect($livro->fresh()->quantidade_disponivel)->toBe(1);
});

test('delivery reserves stock once for a legacy request and legacy aprovar route still works', function () {
    $adm = User::factory()->create(['role' => 'adm']);
    $livro = Livro::factory()->create(['quantidade_disponivel' => 1]);
    $emprestimo = Emprestimo::factory()->solicitado()->create([
        'livro_id' => $livro->id_livro,
        'reserva_ativa' => false,
    ]);

    $this->actingAs($adm, 'sanctum')
        ->patchJson("/api/emprestimos/{$emprestimo->id_emprestimo}/aprovar")
        ->assertOk()
        ->assertJsonPath('status', 'entregue');

    expect($livro->fresh()->quantidade_disponivel)->toBe(0)
        ->and($emprestimo->fresh()->reserva_ativa)->toBeTrue();
});

test('emprestimo inclui o papel do usuario para identificar estudantes nas devolucoes', function () {
    $bibliotecaria = User::factory()->create(['role' => 'bibliotecaria']);
    $aluno = User::factory()->aluno()->create();
    Emprestimo::factory()->create(['usuario_id' => $aluno->id]);

    $this->actingAs($bibliotecaria, 'sanctum')
        ->getJson('/api/emprestimos')
        ->assertOk()
        ->assertJsonPath('0.usuario.role', 'aluno');
});
