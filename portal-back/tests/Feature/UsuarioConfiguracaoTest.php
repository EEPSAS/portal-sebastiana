<?php

use App\Models\Evento;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Storage::fake('public');
});

test('usuario comum pode atualizar o proprio perfil com nickname e telefone', function () {
    $user = User::factory()->create([
        'name' => 'Maria Silva',
        'email' => 'maria@escola.mg.gov.br',
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/usuarios/{$user->id}", [
        'name' => 'Maria Silva Santos',
        'nickname' => 'Mary',
        'email' => 'maria@escola.mg.gov.br',
        'telefone' => '(31) 98888-7777',
    ]);

    $response->assertOk()
        ->assertJsonPath('nickname', 'Mary')
        ->assertJsonPath('telefone', '(31) 98888-7777');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'nickname' => 'Mary',
        'telefone' => '(31) 98888-7777',
    ]);
});

test('usuario comum nao pode alterar o proprio email', function () {
    $user = User::factory()->create([
        'name' => 'Lucas Ferreira',
        'email' => 'lucas.original@escola.mg.gov.br',
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/usuarios/{$user->id}", [
        'name' => 'Lucas Ferreira',
        'email' => 'hacker.novo.email@gmail.com',
    ]);

    $response->assertOk();

    // O e-mail no banco de dados deve permanecer estritamente o original
    expect($user->fresh()->email)->toBe('lucas.original@escola.mg.gov.br');
});

test('definir data de nascimento sincroniza automaticamente com o calendario pessoal', function () {
    $user = User::factory()->create([
        'name' => 'Carlos Souza',
        'nickname' => 'Carlinhos',
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/usuarios/{$user->id}", [
        'name' => 'Carlos Souza',
        'email' => $user->email,
        'data_nascimento' => '2005-09-15',
    ]);

    $response->assertOk();

    $this->assertDatabaseHas('eventos', [
        'criador_id' => $user->id,
        'is_aniversario' => true,
        'titulo' => 'Aniversário de Carlinhos',
        'data_inicio' => date('Y').'-09-15',
    ]);
});

test('remover data de nascimento exclui o evento de aniversario da agenda', function () {
    $user = User::factory()->create([
        'name' => 'Julia Lima',
        'data_nascimento' => '2004-03-20',
    ]);

    $user->syncEventoAniversario('2004-03-20');

    $this->assertDatabaseHas('eventos', [
        'criador_id' => $user->id,
        'is_aniversario' => true,
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/usuarios/{$user->id}", [
        'name' => 'Julia Lima',
        'email' => $user->email,
        'data_nascimento' => null,
    ]);

    $response->assertOk();

    $this->assertDatabaseMissing('eventos', [
        'criador_id' => $user->id,
        'is_aniversario' => true,
    ]);
});

test('usuario pode fazer upload e excluir sua foto de perfil', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $jpeg1x1 = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
    $file = UploadedFile::fake()->createWithContent('foto_perfil.jpg', $jpeg1x1);

    $uploadResponse = $this->postJson("/api/usuarios/{$user->id}/avatar", [
        'avatar' => $file,
    ]);

    $uploadResponse->assertOk();
    $avatarPath = $user->fresh()->avatar;
    expect($avatarPath)->not->toBeNull();
    Storage::disk('public')->assertExists($avatarPath);

    $deleteResponse = $this->deleteJson("/api/usuarios/{$user->id}/avatar");
    $deleteResponse->assertOk();

    expect($user->fresh()->avatar)->toBeNull();
    Storage::disk('public')->assertMissing($avatarPath);
});

test('alterar ou excluir o evento de aniversario no calendario sincroniza o perfil do usuario', function () {
    $user = User::factory()->create([
        'name' => 'Renato Dias',
        'data_nascimento' => '1998-04-10',
    ]);

    $user->syncEventoAniversario('1998-04-10');

    $evento = Evento::where('criador_id', $user->id)->where('is_aniversario', true)->first();
    expect($evento)->not->toBeNull();

    Sanctum::actingAs($user);

    // Atualiza a data do evento no calendário para outro dia (ex: 25 de abril)
    $novaData = date('Y').'-04-25';
    $this->putJson("/api/eventos/{$evento->id}", [
        'titulo' => $evento->titulo,
        'data_inicio' => $novaData,
        'tipo' => $evento->tipo->value,
    ])->assertOk();

    // O perfil do usuário deve ter atualizado o dia e mês preservando o ano de nascimento (1998-04-25)
    expect($user->fresh()->data_nascimento?->format('Y-m-d'))->toBe('1998-04-25');

    // Ao excluir o evento de aniversário pela agenda
    $this->deleteJson("/api/eventos/{$evento->id}")->assertNoContent();

    // A data de nascimento no perfil deve ficar null
    expect($user->fresh()->data_nascimento)->toBeNull();
});
