<?php

use App\Models\Disciplina;
use App\Models\Emprestimo;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use App\Notifications\NotificacaoPortal;
use App\Services\NotificacaoService;
use Illuminate\Http\UploadedFile;

test('especialista envia notificacao individual e aluno pode confirmar a leitura', function () {
    $especialista = User::factory()->especialista()->create();
    $aluno = User::factory()->aluno()->create();
    Matricula::factory()->create(['usuario_id' => $aluno->id]);

    $resposta = $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Entrega de trabalho',
            'assunto' => 'Entregue o trabalho até sexta-feira.',
            'destinatario_tipo' => 'aluno',
            'aluno_id' => $aluno->id,
            'super_importante' => true,
        ]);

    $resposta->assertCreated()
        ->assertJsonPath('0.titulo', 'Entrega de trabalho')
        ->assertJsonPath('0.destinatario_id', $aluno->id)
        ->assertJsonPath('0.prioridade', 'super_importante');

    $notificacaoId = $resposta->json('0.id');
    $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/notificacoes')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $notificacaoId);

    $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/notificacoes/super-importantes')
        ->assertOk()
        ->assertJsonPath('0.id', $notificacaoId);

    $this->patchJson("/api/notificacoes/{$notificacaoId}/lida")
        ->assertOk()
        ->assertJsonPath('id', $notificacaoId);

    expect($aluno->notifications()->whereKey($notificacaoId)->firstOrFail()->read_at)
        ->not->toBeNull();
});

test('bibliotecaria pode notificar somente aluno com devolucao proxima', function () {
    $bibliotecaria = User::factory()->create(['role' => 'bibliotecaria']);
    $alunoComDevolucao = User::factory()->aluno()->create();
    $alunoSemDevolucao = User::factory()->aluno()->create();
    Matricula::factory()->create(['usuario_id' => $alunoComDevolucao->id]);
    Matricula::factory()->create(['usuario_id' => $alunoSemDevolucao->id]);
    Emprestimo::factory()->create([
        'usuario_id' => $alunoComDevolucao->id,
        'status' => 'aprovado',
        'data_prevista_devolucao' => now()->addDays(2),
    ]);

    $this->actingAs($bibliotecaria, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Devolução próxima',
            'assunto' => 'Lembre-se de devolver o livro emprestado.',
            'destinatario_tipo' => 'aluno',
            'aluno_id' => $alunoComDevolucao->id,
        ])
        ->assertCreated()
        ->assertJsonPath('0.destinatario_id', $alunoComDevolucao->id);

    $this->actingAs($bibliotecaria, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Aviso',
            'assunto' => 'Este aluno não aparece nas devoluções próximas.',
            'destinatario_tipo' => 'aluno',
            'aluno_id' => $alunoSemDevolucao->id,
        ])
        ->assertForbidden();

    $this->actingAs($bibliotecaria, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Aviso de turma',
            'assunto' => 'A Bibliotecária não pode enviar para uma turma.',
            'destinatario_tipo' => 'turma',
            'turma_id' => Turma::factory()->create()->id_turma,
        ])
        ->assertUnprocessable();
});

test('professor nao pode notificar aluno fora de turma sob sua regencia', function () {
    $professor = User::factory()->professor()->create();
    $aluno = User::factory()->aluno()->create();
    Matricula::factory()->create(['usuario_id' => $aluno->id]);

    $this->actingAs($professor, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Aviso',
            'assunto' => 'Comunicado de teste.',
            'destinatario_tipo' => 'aluno',
            'aluno_id' => $aluno->id,
        ])
        ->assertForbidden();
});

test('professor receives an explicit forbidden response when requesting a general notification', function () {
    $professor = User::factory()->professor()->create();

    $this->actingAs($professor, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Comunicado geral',
            'assunto' => 'Mensagem para toda a comunidade.',
            'destinatario_tipo' => 'geral',
        ])
        ->assertForbidden()
        ->assertJsonPath('message', 'Somente Especialista ou Administrador pode enviar comunicados gerais.');
});

test('individual manual notifications are stored only for the selected student', function () {
    $especialista = User::factory()->especialista()->create();
    $aluno = User::factory()->aluno()->create();
    $bibliotecaria = User::factory()->bibliotecaria()->create();
    $turma = Turma::factory()->create();
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
    ]);

    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Aviso individual',
            'assunto' => 'Mensagem exclusiva do estudante.',
            'destinatario_tipo' => 'aluno',
            'aluno_id' => $aluno->id,
        ])
        ->assertCreated();

    expect($aluno->notifications()->count())->toBe(1)
        ->and($bibliotecaria->notifications()->count())->toBe(0);

    $this->actingAs($bibliotecaria, 'sanctum')
        ->getJson('/api/notificacoes')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('notificacao para turma alcanca somente matriculas ativas', function () {
    $especialista = User::factory()->especialista()->create();
    $turma = Turma::factory()->create();
    $alunoAtivo = User::factory()->aluno()->create();
    $alunoTransferido = User::factory()->aluno()->create();
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoAtivo->id,
    ]);
    Matricula::factory()->transferido()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $alunoTransferido->id,
    ]);

    $resposta = $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/notificacoes', [
            'titulo' => 'Aviso da turma',
            'assunto' => 'Mensagem para estudantes matriculados.',
            'destinatario_tipo' => 'turma',
            'turma_id' => $turma->id_turma,
        ]);

    $resposta->assertCreated()
        ->assertJsonCount(1)
        ->assertJsonPath('0.destinatario_id', $alunoAtivo->id);

    expect($alunoTransferido->notifications()->count())->toBe(0);
});

test('usuario nao lista nem confirma notificacoes de outra pessoa', function () {
    $destinatario = User::factory()->aluno()->create();
    $outroAluno = User::factory()->aluno()->create();
    $destinatario->notify(new NotificacaoPortal([
        'titulo' => 'Aviso privado',
        'assunto' => 'Conteúdo exclusivo do destinatário.',
        'tipo' => 'manual',
        'origem' => 'usuario',
        'prioridade' => 'importante',
        'criador_id' => null,
        'criador_nome' => 'Sistema de teste',
        'event_key' => 'manual:aviso-privado',
    ]));
    $notificacaoId = $destinatario->notifications()->firstOrFail()->id;

    $this->actingAs($outroAluno, 'sanctum')
        ->getJson('/api/notificacoes')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->patchJson("/api/notificacoes/{$notificacaoId}/lida")->assertNotFound();
});

test('confirmacao em massa atualiza apenas notificacoes padrao', function () {
    $aluno = User::factory()->aluno()->create();
    $dados = [
        'titulo' => 'Aviso de teste',
        'assunto' => 'Conteúdo do aviso.',
        'tipo' => 'sistema',
        'origem' => 'sistema',
        'criador_id' => null,
        'criador_nome' => 'Sistema',
    ];

    // Mantém as prioridades diferentes para confirmar o filtro aplicado pela rota.
    $aluno->notify(new NotificacaoPortal([...$dados, 'prioridade' => 'padrao']));
    $aluno->notify(new NotificacaoPortal([...$dados, 'prioridade' => 'importante']));
    $aluno->notify(new NotificacaoPortal([...$dados, 'prioridade' => 'super_importante']));

    $this->actingAs($aluno, 'sanctum')
        ->patchJson('/api/notificacoes/marcar-padrao-lidas')
        ->assertNoContent();

    $notificacoes = $aluno->notifications()->get()->keyBy(fn ($item) => $item->data['prioridade']);

    expect($notificacoes['padrao']->read_at)->not->toBeNull()
        ->and($notificacoes['importante']->read_at)->toBeNull()
        ->and($notificacoes['super_importante']->read_at)->toBeNull();
});

test('alerta de frequencia respeita o limite do boletim e nao duplica na reimportacao', function () {
    $turma = Turma::factory()->create(['ano_letivo' => 2026]);
    $disciplina = Disciplina::factory()->create(['carga_horaria_anual' => 60]);
    $aluno = User::factory()->aluno()->create();
    $professor = User::factory()->professor()->create();
    $especialista = User::factory()->especialista()->create();

    TurmaDisciplina::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professor->id,
    ]);

    $frequencia = Frequencia::create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'data_aula' => '2026-02-12',
        'quantidade_aulas' => 4,
        'status_presenca' => 'Falta',
    ]);

    $dadosAlunos = [[
        'usuario_id' => $aluno->id,
        'notas' => [],
        'faltas' => [['disciplina_id' => $disciplina->id_disciplina]],
    ]];
    $service = app(NotificacaoService::class);

    $service->notificarImportacaoAcademica($turma, $dadosAlunos, '1º Trimestre', '2026-02-12');
    expect($aluno->notifications()->count())->toBe(0);

    $frequencia->update(['quantidade_aulas' => 6]);
    $service->notificarImportacaoAcademica($turma, $dadosAlunos, '1º Trimestre', '2026-02-12');
    $service->notificarImportacaoAcademica($turma, $dadosAlunos, '1º Trimestre', '2026-02-12');

    $avisosAluno = $aluno->notifications()->get();

    expect($avisosAluno)->toHaveCount(1)
        ->and($avisosAluno->pluck('data')->pluck('assunto')->implode(' '))
        ->toContain('70,0%');

    expect($professor->notifications()->count())->toBe(1)
        ->and($especialista->notifications()->count())->toBe(1);
});

test('CSV import creates individual grade and attendance alerts after successful synchronization', function () {
    $especialista = User::factory()->especialista()->create();
    $turma = Turma::factory()->create(['ano_letivo' => 2026]);
    $disciplina = Disciplina::factory()->create([
        'nome' => 'Física',
        'carga_horaria_anual' => 60,
    ]);
    // A disciplina deve estar previamente vinculada à turma para receber notas/faltas via CSV
    $turma->disciplinas()->attach($disciplina->id_disciplina);
    $aluno = User::factory()->aluno()->create([
        'name' => 'Aluno Alerta CSV',
        'email' => 'aluno.alerta.csv@aluno.mg.gov.br',
    ]);
    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
    ]);

    $csv = implode("\n", [
        'ALUNO;Física;',
        ';1º Trimestre;FALTAS',
        'ALUNO ALERTA CSV;10;6',
    ]);
    $arquivo = UploadedFile::fake()->createWithContent('alertas.csv', $csv);

    $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/importar-relatorio", [
            'arquivo' => $arquivo,
            'periodo_letivo' => '1º Trimestre',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'sucesso')
        ->assertJsonPath('dados.notas_sincronizadas', 1)
        ->assertJsonPath('dados.frequencias_sincronizadas', 1);

    expect($aluno->notifications()->where('data->tipo', 'nota_alerta')->count())->toBe(1)
        ->and($aluno->notifications()->where('data->tipo', 'frequencia_risco')->count())->toBe(1);
});

test('lembrete apos tres dias e enviado uma unica vez ao aluno e ao criador', function () {
    $aluno = User::factory()->aluno()->create();
    $especialista = User::factory()->especialista()->create();

    $aluno->notify(new NotificacaoPortal([
        'titulo' => 'Prazo de atividade',
        'assunto' => 'A atividade ainda não foi confirmada.',
        'tipo' => 'manual',
        'origem' => 'usuario',
        'prioridade' => 'importante',
        'criador_id' => $especialista->id,
        'criador_nome' => $especialista->name,
        'event_key' => 'manual:teste-lembrete',
    ]));
    $aluno->notifications()->firstOrFail()
        ->forceFill(['created_at' => now()->subDays(4)])
        ->save();

    $this->artisan('app:enviar-lembretes-notificacoes')->assertExitCode(0);
    $this->artisan('app:enviar-lembretes-notificacoes')->assertExitCode(0);

    expect($aluno->notifications()->where('data->tipo', 'lembrete')->count())->toBe(1)
        ->and($especialista->notifications()->where('data->tipo', 'lembrete')->count())->toBe(1);
});
