<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\RemessaDocente;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('professor pode enviar remessa docente com arquivo anexo e consultar suas remessas', function () {
    Storage::fake('public');

    $professor = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    $file = UploadedFile::fake()->create('diario_de_classe.pdf', 150, 'application/pdf');

    $response = $this->actingAs($professor, 'sanctum')->postJson('/api/remessas', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'tipo_dado' => 'Frequência',
        'arquivo_anexo' => $file,
        'observacoes' => 'Diário de frequência referente a Fevereiro',
    ]);

    $response->assertCreated()
        ->assertJsonPath('status_processamento', 'Pendente')
        ->assertJsonPath('tipo_dado', 'Frequência');

    $remessaId = $response->json('id_remessa');

    // Professor consulta próprias remessas
    $this->actingAs($professor, 'sanctum')->getJson('/api/remessas/minhas')
        ->assertOk()
        ->assertJsonFragment(['id_remessa' => $remessaId]);
});

test('especialista e admin podem listar pendentes e marcar como anexado ou rejeitado', function () {
    $admin = User::factory()->create(['role' => UserRole::ADM]);
    $remessa = RemessaDocente::factory()->create([
        'status_processamento' => 'Pendente',
    ]);

    // Listar pendentes
    $this->actingAs($admin, 'sanctum')->getJson('/api/remessas/pendentes')
        ->assertOk()
        ->assertJsonFragment(['id_remessa' => $remessa->id_remessa]);

    // Marcar como anexado
    $this->actingAs($admin, 'sanctum')->patchJson("/api/remessas/{$remessa->id_remessa}/anexado", [
        'observacoes' => 'Notas lançadas no sistema com sucesso.',
    ])->assertOk()
        ->assertJsonPath('status_processamento', 'Anexado');

    // Outra remessa para rejeitar
    $remessa2 = RemessaDocente::factory()->create([
        'status_processamento' => 'Pendente',
    ]);

    // Marcar como rejeitado
    $this->actingAs($admin, 'sanctum')->patchJson("/api/remessas/{$remessa2->id_remessa}/rejeitado", [
        'observacoes' => 'Planilha corrompida, favor reenviar.',
    ])->assertOk()
        ->assertJsonPath('status_processamento', 'Rejeitado');
});

test('usuario padrao nao pode listar pendentes nem alterar status de remessas', function () {
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);
    $remessa = RemessaDocente::factory()->create();

    $this->actingAs($aluno, 'sanctum')->getJson('/api/remessas/pendentes')
        ->assertForbidden();

    $this->actingAs($aluno, 'sanctum')->patchJson("/api/remessas/{$remessa->id_remessa}/anexado")
        ->assertForbidden();
});
