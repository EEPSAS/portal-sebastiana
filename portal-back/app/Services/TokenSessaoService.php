<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Service responsável pelas regras de negócio, consulta, revogação manual
 * e expurgo automático de tokens de sessão do Laravel Sanctum.
 */
class TokenSessaoService
{
    /**
     * Retorna o tempo máximo de vida do token em minutos (padrão: 360 min = 6 horas).
     */
    public function obterLimiteMinutos(): int
    {
        $minutos = (int) config('sanctum.expiration', 360);

        return $minutos > 0 ? $minutos : 360;
    }

    /**
     * Aplica na query a condição de tokens ativos (dentro do prazo de 6 horas).
     *
     * @param  Builder<PersonalAccessToken>  $query
     * @return Builder<PersonalAccessToken>
     */
    public function aplicarEscopoAtivos(Builder $query): Builder
    {
        $agora = now();
        $limiteCriacao = $agora->copy()->subMinutes($this->obterLimiteMinutos());

        return $query
            ->where(function (Builder $q) use ($agora): void {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $agora);
            })
            ->where(function (Builder $q) use ($limiteCriacao): void {
                $q->whereNull('created_at')
                    ->orWhere('created_at', '>', $limiteCriacao);
            });
    }

    /**
     * Aplica na query a condição de tokens vencidos (que passaram de expires_at ou de 6h desde a criação).
     *
     * @param  Builder<PersonalAccessToken>  $query
     * @return Builder<PersonalAccessToken>
     */
    public function aplicarEscopoExpirados(Builder $query): Builder
    {
        $agora = now();
        $limiteCriacao = $agora->copy()->subMinutes($this->obterLimiteMinutos());

        return $query->where(function (Builder $q) use ($agora, $limiteCriacao): void {
            $q->where(function (Builder $sub) use ($agora): void {
                $sub->whereNotNull('expires_at')
                    ->where('expires_at', '<=', $agora);
            })->orWhere(function (Builder $sub) use ($limiteCriacao): void {
                $sub->whereNotNull('created_at')
                    ->where('created_at', '<=', $limiteCriacao);
            });
        });
    }

    /**
     * Contabiliza apenas os tokens Sanctum ativos (não vencidos) para o KPI do painel administrativo.
     */
    public function contarSessoesAtivas(): int
    {
        return (int) $this->aplicarEscopoAtivos(PersonalAccessToken::query())->count();
    }

    /**
     * Retorna os contadores consolidados de tokens (ativos, expirados aguardando limpeza e total no banco).
     *
     * @return array{ativos: int, expirados: int, total: int}
     */
    public function obterResumoContadores(): array
    {
        $ativos = $this->contarSessoesAtivas();
        $expirados = (int) $this->aplicarEscopoExpirados(PersonalAccessToken::query())->count();

        return [
            'ativos' => $ativos,
            'expirados' => $expirados,
            'total' => $ativos + $expirados,
        ];
    }

    /**
     * Lista os tokens registrados na tabela com filtros por usuário, origem, status e paginação.
     *
     * @param  array<string, mixed>  $filtros
     * @return LengthAwarePaginator<int, PersonalAccessToken>
     */
    public function listarTokens(array $filtros = []): LengthAwarePaginator
    {
        $query = PersonalAccessToken::query()->with('tokenable');

        // Filtro por origem do token (login_senha, login_google, auto_cadastro)
        if (! empty($filtros['origem']) && is_string($filtros['origem'])) {
            $query->where('origem', $filtros['origem']);
        }

        // Filtro por usuário específico
        if (! empty($filtros['usuario_id'])) {
            $query->where('tokenable_type', User::class)
                ->where('tokenable_id', (int) $filtros['usuario_id']);
        }

        // Filtro por status de validade (ativo ou expirado)
        $status = $filtros['status'] ?? null;
        if ($status === 'ativo') {
            $this->aplicarEscopoAtivos($query);
        } elseif ($status === 'expirado') {
            $this->aplicarEscopoExpirados($query);
        }

        // Busca textual por nome/e-mail do usuário dono, endereço IP ou User-Agent
        if (! empty($filtros['busca']) && is_string($filtros['busca'])) {
            $termo = trim($filtros['busca']);
            $query->where(function (Builder $q) use ($termo): void {
                $q->where('ip_address', 'like', "%{$termo}%")
                    ->orWhere('user_agent', 'like', "%{$termo}%")
                    ->orWhere('name', 'like', "%{$termo}%")
                    ->orWhereHasMorph('tokenable', [User::class], function (Builder $userQuery) use ($termo): void {
                        $userQuery->where('name', 'like', "%{$termo}%")
                            ->orWhere('email', 'like', "%{$termo}%");
                    });
            });
        }

        $perPage = isset($filtros['per_page']) ? max(5, min(100, (int) $filtros['per_page'])) : 15;

        return $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Revoga (deleta manualmente) um token específico.
     */
    public function revogarToken(PersonalAccessToken $token): void
    {
        $token->delete();
    }

    /**
     * Revoga todos os tokens pertencentes a um usuário específico.
     */
    public function revogarTokensDoUsuario(User $usuario, ?int $excetoTokenId = null): int
    {
        $query = $usuario->tokens();

        // Quando o administrador revoga as próprias sessões em lote, preserva opcionalmente o token em uso
        if ($excetoTokenId !== null) {
            $query->where('id', '!=', $excetoTokenId);
        }

        return (int) $query->delete();
    }

    /**
     * Remove fisicamente do banco todos os tokens que já ultrapassaram 6 horas de vida ou expires_at.
     */
    public function limparTokensExpirados(): int
    {
        return (int) $this->aplicarEscopoExpirados(PersonalAccessToken::query())->delete();
    }
}
