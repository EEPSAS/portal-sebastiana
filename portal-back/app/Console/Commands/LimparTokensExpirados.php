<?php

namespace App\Console\Commands;

use App\Services\TokenSessaoService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Comando Artisan executado pelo Scheduler a cada 8 horas para expurgar
 * tokens Sanctum vencidos (que já ultrapassaram o limite de 6 horas).
 */
#[Signature('app:limpar-tokens-expirados')]
#[Description('Remove fisicamente os tokens Sanctum expirados (com mais de 6 horas de vida)')]
class LimparTokensExpirados extends Command
{
    /**
     * Executa a limpeza automática dos tokens vencidos.
     */
    public function handle(TokenSessaoService $tokenSessaoService): int
    {
        // Deleta todos os registros de personal_access_tokens cujo prazo de 6h expirou
        $removidos = $tokenSessaoService->limparTokensExpirados();

        $this->info("Tokens expirados removidos: {$removidos}.");

        return self::SUCCESS;
    }
}
