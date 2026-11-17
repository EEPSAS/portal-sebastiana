<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Resource de blindagem de saída dos tokens Sanctum.
 *
 * Registra e retorna a existência, origem, dispositivo e datas do token,
 * garantindo que o hash/valor secreto (`token`) jamais seja exposto na API.
 *
 * @mixin PersonalAccessToken
 */
class TokenSessaoResource extends JsonResource
{
    /**
     * Transforma o registro de token em um array seguro para auditoria.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var PersonalAccessToken $token */
        $token = $this->resource;

        // Recupera o tempo máximo configurado no Sanctum (padrão: 360 min = 6 horas)
        $minutosExpiracao = (int) config('sanctum.expiration', 360);
        $limiteMinutos = $minutosExpiracao > 0 ? $minutosExpiracao : 360;

        // Calcula a data efetiva de expiração (usa expires_at explícito ou created_at + 6h)
        $expiraEm = $token->expires_at ?? $token->created_at?->copy()->addMinutes($limiteMinutos);

        // Um token é considerado expirado se expires_at já passou ou se já superou 6h desde a criação
        $expirado = ($token->expires_at !== null && $token->expires_at->isPast())
            || ($token->created_at !== null && $token->created_at->lte(now()->subMinutes($limiteMinutos)));

        $origemBruta = (string) ($token->getAttribute('origem') ?: 'login_senha');
        $userAgent = $token->getAttribute('user_agent');
        $ipAddress = $token->getAttribute('ip_address');

        // Identifica se o registro listado corresponde à sessão atual do administrador logado
        $tokenAtual = $request->user()?->currentAccessToken();
        $tokenAtualId = $tokenAtual instanceof PersonalAccessToken ? (int) $tokenAtual->id : null;

        $usuario = $token->relationLoaded('tokenable') ? $token->tokenable : null;

        return [
            'id' => (int) $token->id,
            'name' => (string) $token->name,
            'origem' => $origemBruta,
            'origem_label' => self::rotuloOrigem($origemBruta),
            'ip_address' => is_string($ipAddress) && $ipAddress !== '' ? $ipAddress : null,
            'user_agent' => is_string($userAgent) && $userAgent !== '' ? $userAgent : null,
            'dispositivo_resumo' => self::resumirDispositivo(is_string($userAgent) ? $userAgent : null),
            'created_at' => $token->created_at?->toIso8601String(),
            'criado_ha' => $token->created_at?->diffForHumans(),
            'last_used_at' => $token->last_used_at?->toIso8601String(),
            'ultimo_uso_ha' => $token->last_used_at?->diffForHumans(),
            'expires_at' => $expiraEm?->toIso8601String(),
            'expirado' => $expirado,
            'sessao_atual' => $tokenAtualId !== null && (int) $token->id === $tokenAtualId,
            'usuario' => $usuario instanceof User ? [
                'id' => (int) $usuario->id,
                'name' => (string) $usuario->name,
                'email' => (string) $usuario->email,
                'role' => (string) ($usuario->getRawOriginal('role') ?: 'aluno'),
            ] : null,
        ];
    }

    /**
     * Traduz o identificador interno da origem para um rótulo legível no painel.
     */
    public static function rotuloOrigem(string $origem): string
    {
        return match ($origem) {
            'login_google' => 'Login Institucional Google',
            'auto_cadastro' => 'Auto-cadastro no Portal',
            default => 'Login E-mail e Senha',
        };
    }

    /**
     * Extrai um resumo amigável de Navegador + Sistema Operacional a partir do User-Agent.
     */
    public static function resumirDispositivo(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'Dispositivo não identificado';
        }

        // Identifica o navegador principal
        $navegador = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'OPR/') || str_contains($userAgent, 'Opera') => 'Opera',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Safari/') => 'Safari',
            str_contains($userAgent, 'Postman') || str_contains($userAgent, 'Insomnia') => 'Cliente API',
            str_contains($userAgent, 'Symfony') || str_contains($userAgent, 'Guzzle') => 'Cliente HTTP / Teste',
            default => 'Navegador Web',
        };

        // Identifica o sistema operacional
        $sistema = match (true) {
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad') => 'iOS',
            str_contains($userAgent, 'Mac OS X') || str_contains($userAgent, 'Macintosh') => 'macOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => '',
        };

        return $sistema !== '' ? "{$navegador} • {$sistema}" : $navegador;
    }
}
