<?php

use App\Enums\UserRole;
use App\Models\DonaNanaConfig;
use App\Models\User;
use App\Services\DonaNanaService;

/**
 * Testes unitários da montagem de contexto pedagógico e formatação de histórico no DonaNanaService.
 */
test('DonaNanaConfig monta prompt consolidado com os 4 pilares da persona', function () {
    $config = new DonaNanaConfig(DonaNanaConfig::valoresPadrao());
    $prompt = $config->montarPromptCompleto();

    expect($prompt)
        ->toContain('### SUA PERSONALIDADE:')
        ->toContain('### SEU CONHECIMENTO SOBRE O PORTAL:')
        ->toContain('### SUAS HISTÓRIAS E CAUSOS:')
        ->toContain('### DIRETRIZES DE RESPOSTA:')
        ->toContain('Jaguaraçu');
});

test('DonaNanaService adapta prompt ao contexto balao vs aba e formata historico multi-turn', function () {
    // Cria subclasse anônima de inspeção para testar métodos protegidos puros sem tocar no banco
    $service = new class extends DonaNanaService
    {
        public function inspecionarPrompt(DonaNanaConfig $config, ?User $user, ?string $origem): string
        {
            return $this->montarSystemPromptContextualizado($config, $user, $origem);
        }

        public function inspecionarHistorico(array $historico, string $mensagem): array
        {
            return $this->formatarHistoricoGemini($historico, $mensagem);
        }

        public function inspecionarFallback(string $mensagem, ?User $user, ?string $extra = null): array
        {
            return $this->gerarRespostaFallback($mensagem, $user, $extra);
        }
    };

    $config = new DonaNanaConfig(DonaNanaConfig::valoresPadrao());
    $usuario = User::factory()->make([
        'name' => 'Maria Clara',
        'nickname' => 'Clarinha',
        'role' => UserRole::ALUNO,
    ]);

    $promptBalao = $service->inspecionarPrompt($config, $usuario, 'balao');
    $promptAba = $service->inspecionarPrompt($config, $usuario, 'aba');

    expect($promptBalao)
        ->toContain('Nome: Clarinha')
        ->toContain('Papel no Portal: aluno')
        ->toContain('Balão Flutuante Rápido')
        ->and($promptAba)
        ->toContain('Aba Completa do Dashboard');

    // Valida normalização de papéis do histórico ('assistant' vira 'model' e entradas vazias são ignoradas)
    $contents = $service->inspecionarHistorico([
        ['role' => 'user', 'text' => 'Olá Dona Nana!'],
        ['role' => 'assistant', 'text' => 'Olá meu filho!'],
        ['role' => 'user', 'text' => '   '],
    ], 'Qual o horário da biblioteca?');

    expect($contents)->toHaveCount(3)
        ->and($contents[0]['role'])->toBe('user')
        ->and($contents[1]['role'])->toBe('model')
        ->and($contents[2]['parts'][0]['text'])->toBe('Qual o horário da biblioteca?');

    $fallback = $service->inspecionarFallback('Oi', $usuario, 'Aviso de teste');
    expect($fallback['origem'])->toBe('fallback-local')
        ->and($fallback['resposta'])->toContain('Clarinha')
        ->and($fallback['resposta'])->toContain('Aviso de teste')
        ->and($fallback['sugestoes'])->toHaveCount(4);
});
