<?php

use App\Enums\UserRole;
use App\Models\Atividade;
use App\Models\Disciplina;
use App\Models\Submissao;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('professor ou admin pode criar atividade com anexo, atualizar, listar e deletar', function () {
    Storage::fake('public');

    $professor = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    $anexo = UploadedFile::fake()->create('roteiro_estudo.pdf', 200, 'application/pdf');

    // 1. Criar Atividade
    $response = $this->actingAs($professor, 'sanctum')->postJson('/api/atividades', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'titulo' => 'Pesquisa sobre Radioatividade',
        'descricao_texto' => 'Produzir um relatório dissertativo sobre os impactos das usinas nucleares.',
        'arquivo_anexo' => $anexo,
        'data_limite_entrega' => now()->addDays(5)->toDateTimeString(),
        'valor_pontuacao' => 10.0,
        'status_atividade' => 'Aberta',
    ]);

    $response->assertCreated()
        ->assertJsonPath('titulo', 'Pesquisa sobre Radioatividade')
        ->assertJsonPath('status_atividade', 'Aberta')
        ->assertJsonPath('valor_pontuacao', 10);

    $atividadeId = $response->json('id_atividade');
    $caminhoAnexo = $response->json('caminho_arquivo_anexo');
    expect($caminhoAnexo)->not->toBeNull();
    Storage::disk('public')->assertExists($caminhoAnexo);

    // 2. Listar por turma e disciplina
    $this->actingAs($professor, 'sanctum')
        ->getJson("/api/turmas/{$turma->id_turma}/disciplinas/{$disciplina->id_disciplina}/atividades")
        ->assertOk()
        ->assertJsonFragment(['id_atividade' => $atividadeId]);

    // 3. Atualizar Atividade
    $this->actingAs($professor, 'sanctum')->putJson("/api/atividades/{$atividadeId}", [
        'titulo' => 'Pesquisa sobre Energia Nuclear',
    ])->assertOk()
        ->assertJsonPath('titulo', 'Pesquisa sobre Energia Nuclear');

    // 4. Encerrar manualmente
    $this->actingAs($professor, 'sanctum')->patchJson("/api/atividades/{$atividadeId}/encerrar")
        ->assertOk()
        ->assertJsonPath('status_atividade', 'Encerrada');

    // 5. Deletar Atividade
    $this->actingAs($professor, 'sanctum')->deleteJson("/api/atividades/{$atividadeId}")
        ->assertNoContent();

    expect(Atividade::find($atividadeId))->toBeNull();
    Storage::disk('public')->assertMissing($caminhoAnexo);
});

test('usuario padrao nao tem permissao para criar atividades', function () {
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    $this->actingAs($aluno, 'sanctum')->postJson('/api/atividades', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'titulo' => 'Tentativa Indevida',
        'descricao_texto' => 'Descrição',
        'data_limite_entrega' => now()->addDays(2)->toDateTimeString(),
    ])->assertForbidden();
});

test('aluno pode enviar resolucao, editar e cancelar envio antes do prazo limite', function () {
    Storage::fake('public');

    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);
    $atividade = Atividade::factory()->create([
        'data_limite_entrega' => now()->addDays(3),
        'status_atividade' => 'Aberta',
        'valor_pontuacao' => 10.0,
    ]);

    $arquivoResposta = UploadedFile::fake()->create('resposta_exercicios.pdf', 100, 'application/pdf');

    // 1. Enviar Resolução (enviar_resolucao)
    $response = $this->actingAs($aluno, 'sanctum')->postJson("/api/atividades/{$atividade->id_atividade}/submissoes", [
        'texto_resposta' => 'Segue em anexo a resolução dos exercícios 1 a 10.',
        'arquivo' => $arquivoResposta,
    ]);

    $response->assertCreated()
        ->assertJsonPath('usuario_id', $aluno->id)
        ->assertJsonPath('atividade_id', $atividade->id_atividade);

    $submissaoId = $response->json('id_submissao');
    $caminhoArquivo = $response->json('caminho_arquivo_entregue');
    expect($caminhoArquivo)->not->toBeNull();
    Storage::disk('public')->assertExists($caminhoArquivo);

    // 2. Tentar enviar novamente (deve ser rejeitado)
    $this->actingAs($aluno, 'sanctum')->postJson("/api/atividades/{$atividade->id_atividade}/submissoes", [
        'texto_resposta' => 'Outra resposta',
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Você já enviou uma resolução para esta atividade. Utilize a opção de editar ou cancelar envio.');

    // 3. Consultar a própria submissão
    $this->actingAs($aluno, 'sanctum')->getJson("/api/atividades/{$atividade->id_atividade}/minha-submissao")
        ->assertOk()
        ->assertJsonPath('id_submissao', $submissaoId);

    // 4. Editar envio antes do prazo (editar_envio)
    $novoArquivo = UploadedFile::fake()->create('resposta_revisada.pdf', 120, 'application/pdf');

    $this->actingAs($aluno, 'sanctum')->putJson("/api/submissoes/{$submissaoId}", [
        'texto_resposta' => 'Versão revisada com correções nos exercícios 4 e 7.',
        'arquivo' => $novoArquivo,
    ])->assertOk()
        ->assertJsonPath('texto_resposta', 'Versão revisada com correções nos exercícios 4 e 7.');

    // Arquivo antigo deve ter sido removido e o novo salvo
    Storage::disk('public')->assertMissing($caminhoArquivo);
    $submissaoAtualizada = Submissao::find($submissaoId);
    Storage::disk('public')->assertExists($submissaoAtualizada->caminho_arquivo_entregue);

    // 5. Cancelar envio antes do prazo (cancelar_envio)
    $this->actingAs($aluno, 'sanctum')->deleteJson("/api/submissoes/{$submissaoId}")
        ->assertNoContent();

    expect(Submissao::find($submissaoId))->toBeNull();
    Storage::disk('public')->assertMissing($submissaoAtualizada->caminho_arquivo_entregue);
});

test('bloqueia envio e edicao de resolucao apos encerramento ou expiracao do prazo limite', function () {
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    // Atividade com prazo vencido
    $atividadeExpirada = Atividade::factory()->create([
        'data_limite_entrega' => now()->subDay(),
        'status_atividade' => 'Aberta',
    ]);

    $this->actingAs($aluno, 'sanctum')->postJson("/api/atividades/{$atividadeExpirada->id_atividade}/submissoes", [
        'texto_resposta' => 'Tentativa com atraso',
    ])->assertStatus(422)
        ->assertJsonPath('message', 'O recebimento de resoluções para esta atividade está encerrado ou o prazo limite expirou.');

    // Submissão prévia em atividade que acabou de ser encerrada
    $atividadeEncerrada = Atividade::factory()->create([
        'data_limite_entrega' => now()->addDays(2),
        'status_atividade' => 'Encerrada',
    ]);

    $submissao = Submissao::factory()->create([
        'atividade_id' => $atividadeEncerrada->id_atividade,
        'usuario_id' => $aluno->id,
    ]);

    // Tentativa de editar com atividade encerrada
    $this->actingAs($aluno, 'sanctum')->putJson("/api/submissoes/{$submissao->id_submissao}", [
        'texto_resposta' => 'Tentando editar fora do prazo',
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Não é possível editar a submissão após o encerramento do prazo limite ou com a atividade encerrada.');

    // Tentativa de cancelar com atividade encerrada
    $this->actingAs($aluno, 'sanctum')->deleteJson("/api/submissoes/{$submissao->id_submissao}")
        ->assertStatus(422)
        ->assertJsonPath('message', 'Não é possível cancelar o envio após o encerramento do prazo limite ou com a atividade encerrada.');
});

test('professor pode avaliar submissao com nota e registrar feedback explicativo', function () {
    $professor = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    $atividade = Atividade::factory()->create([
        'usuario_id' => $professor->id,
        'valor_pontuacao' => 10.0,
    ]);

    $submissao = Submissao::factory()->create([
        'atividade_id' => $atividade->id_atividade,
        'usuario_id' => $aluno->id,
        'texto_resposta' => 'Resposta do aluno.',
    ]);

    // 1. Tentar avaliar com nota maior que o permitido
    $this->actingAs($professor, 'sanctum')->patchJson("/api/submissoes/{$submissao->id_submissao}/avaliar", [
        'nota_atribuida' => 15.0,
    ])->assertStatus(422);

    // 2. Avaliar submissão com nota válida (avaliar_submissao)
    $this->actingAs($professor, 'sanctum')->patchJson("/api/submissoes/{$submissao->id_submissao}/avaliar", [
        'nota_atribuida' => 9.5,
        'feedback_comentario_professor' => 'Ótima estruturação teórica!',
    ])->assertOk()
        ->assertJsonPath('nota_atribuida', 9.5)
        ->assertJsonPath('feedback_comentario_professor', 'Ótima estruturação teórica!');

    // 3. Atualizar feedback separadamente (registrar_feedback)
    $this->actingAs($professor, 'sanctum')->patchJson("/api/submissoes/{$submissao->id_submissao}/feedback", [
        'feedback_comentario_professor' => 'Parabéns pela dedicação e clareza na exposição.',
    ])->assertOk()
        ->assertJsonPath('feedback_comentario_professor', 'Parabéns pela dedicação e clareza na exposição.');

    // 4. Aluno consulta e vê a nota e o feedback
    $this->actingAs($aluno, 'sanctum')->getJson("/api/submissoes/{$submissao->id_submissao}")
        ->assertOk()
        ->assertJsonPath('nota_atribuida', 9.5)
        ->assertJsonPath('feedback_comentario_professor', 'Parabéns pela dedicação e clareza na exposição.');

    // 5. Aluno tenta avaliar sua própria submissão (deve ser proibido)
    $this->actingAs($aluno, 'sanctum')->patchJson("/api/submissoes/{$submissao->id_submissao}/avaliar", [
        'nota_atribuida' => 10.0,
    ])->assertForbidden();
});
