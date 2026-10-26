<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class NotificacaoPortal extends Notification
{
    public function __construct(private readonly array $dados) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Cada destinatário recebe seu próprio estado de leitura no canal nativo do Laravel.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return array_merge($this->dados, [
            'destinatario_id' => $notifiable->getKey(),
        ]);
    }
}
