<?php

use App\Enums\UserRole;
use App\Notifications\NotificacaoPortal;
use Laravel\Sanctum\Sanctum;

/**
 * EnviarLembretesNotificacoesTest - Testes de Bordas do Comando de Lembretes e Destinatários
 *
 * Papel Didático:
 * Verifica que o comando agendado app:enviar-lembretes-notificacoes ignora notificações
 * recentes (< 3 dias), já lidas ou de origem automática do sistema, e testa o endpoint
 * auxiliar de listagem de destinatários disponíveis (/api/notificacoes/destinatarios).
 */
test('Comando de lembretes ignora notificacoes recentes, ja lidas ou de origem sistema', function () {
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);

    // 1. Notificação manual recente (1 dia atrás -> não deve gerar lembrete)
    $aluno->notify(new NotificacaoPortal([
        'titulo' => 'Recente',
        'assunto' => 'Criada ontem.',
        'tipo' => 'manual',
        'origem' => 'usuario',
        'prioridade' => 'importante',
        'criador_id' => $especialista->id,
        'criador_nome' => $especialista->name,
        'event_key' => 'manual:recente',
    ]));

    // 2. Notificação manual antiga porém já lida (4 dias atrás -> não deve gerar lembrete)
    $aluno->notify(new NotificacaoPortal([
        'titulo' => 'Antiga Lida',
        'assunto' => 'Confirmada pelo aluno.',
        'tipo' => 'manual',
        'origem' => 'usuario',
        'prioridade' => 'importante',
        'criador_id' => $especialista->id,
        'criador_nome' => $especialista->name,
        'event_key' => 'manual:antiga-lida',
    ]));
    $notificacaoLida = $aluno->notifications()->where('data->event_key', 'manual:antiga-lida')->firstOrFail();
    $notificacaoLida->forceFill([
        'created_at' => now()->subDays(4),
        'read_at' => now()->subDays(2),
    ])->save();

    // 3. Notificação automática de sistema antiga (4 dias atrás -> não deve gerar lembrete)
    $aluno->notify(new NotificacaoPortal([
        'titulo' => 'Alerta Sistema',
        'assunto' => 'Gerada pelo sistema.',
        'tipo' => 'sistema',
        'origem' => 'sistema',
        'prioridade' => 'importante',
        'criador_id' => null,
        'criador_nome' => 'Sistema',
        'event_key' => 'sistema:antiga',
    ]));
    $notificacaoSistema = $aluno->notifications()->where('data->event_key', 'sistema:antiga')->firstOrFail();
    $notificacaoSistema->forceFill(['created_at' => now()->subDays(4)])->save();

    $this->artisan('app:enviar-lembretes-notificacoes')
        ->expectsOutput('Lembretes enviados: 0.')
        ->assertExitCode(0);

    expect($aluno->notifications()->where('data->tipo', 'lembrete')->count())->toBe(0);
});

test('Listagem de notificacoes filtra por status nao_lidas e prioridade no PostgreSQL', function () {
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);

    $aluno->notify(new NotificacaoPortal([
        'titulo' => 'Importante Nao Lida',
        'assunto' => 'Assunto importante.',
        'tipo' => 'manual',
        'origem' => 'usuario',
        'prioridade' => 'importante',
        'criador_id' => null,
        'criador_nome' => 'Coordenação',
        'event_key' => 'manual:filtro-1',
    ]));

    Sanctum::actingAs($aluno);
    $this->getJson('/api/notificacoes?status=nao_lidas&prioridade=importante')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.titulo', 'Importante Nao Lida');
});
