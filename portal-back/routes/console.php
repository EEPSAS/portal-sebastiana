<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('app:enviar-lembretes-notificacoes')
    ->daily()
    ->withoutOverlapping();

// Rotina agendada a cada 8 horas para expurgar tokens Sanctum vencidos (que duram no máximo 6h)
Schedule::command('app:limpar-tokens-expirados')
    ->cron('0 */8 * * *')
    ->withoutOverlapping();
