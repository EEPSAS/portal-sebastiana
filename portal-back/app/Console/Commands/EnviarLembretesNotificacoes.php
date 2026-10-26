<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\NotificacaoPortal;
use App\Services\NotificacaoService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;

#[Signature('app:enviar-lembretes-notificacoes')]
#[Description('Envia lembretes únicos para notificações manuais não confirmadas há três dias')]
class EnviarLembretesNotificacoes extends Command
{
    public function handle(NotificacaoService $notificacaoService): int
    {
        $enviados = 0;

        DatabaseNotification::query()
            ->where('type', NotificacaoPortal::class)
            ->where('data->origem', 'usuario')
            ->whereNull('read_at')
            ->whereNull('reminded_at')
            ->where('created_at', '<=', now()->subDays(3))
            ->orderBy('created_at')
            ->chunkById(100, function ($notificacoes) use ($notificacaoService, &$enviados): void {
                foreach ($notificacoes as $notificacao) {
                    DB::transaction(function () use ($notificacao, $notificacaoService, &$enviados): void {
                        $registro = DatabaseNotification::query()
                            ->whereKey($notificacao->id)
                            ->lockForUpdate()
                            ->first();

                        if (! $registro || $registro->read_at || $registro->reminded_at) {
                            return;
                        }

                        $destinatario = $registro->notifiable;
                        if (! $destinatario instanceof User) {
                            return;
                        }

                        $criadorId = $registro->data['criador_id'] ?? null;
                        $criador = $criadorId ? User::find($criadorId) : null;

                        $notificacaoService->enviarLembreteManual(
                            $destinatario,
                            $criador,
                            $registro->data
                        );

                        $registro->forceFill(['reminded_at' => now()])->save();
                        $enviados++;
                    });
                }
            });

        $this->info("Lembretes enviados: {$enviados}.");

        return self::SUCCESS;
    }
}
