<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

/**
 * Provedor Principal de Serviços da Aplicação (AppServiceProvider)
 *
 * Papel Didático:
 * Centraliza configurações globais executadas na inicialização do Laravel, como
 * formatação de respostas JSON dos API Resources e regras mestras de autorização (Gates).
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Registra serviços no container de injeção de dependência.
     */
    public function register(): void
    {
        //
    }

    /**
     * Inicializa comportamentos globais da aplicação após o registro dos serviços.
     */
    public function boot(): void
    {
        // Remove o envelope externo padrão {"data": ...} nos retornos unitários de API Resources,
        // mantendo o JSON enxuto e 100% aderente ao apiContract.md.
        JsonResource::withoutWrapping();

        $this->configureDefaults();

        // Concede permissão irrestrita (bypass em Policies/Gates) para o perfil Administrador (adm).
        Gate::before(function ($user, string $ability) {
            if ($user instanceof User && ($user->isAdm() || $user->hasPermissionTo('acesso_total'))) {
                return true;
            }
        });
    }

    /**
     * Define padrões seguros para datas imutáveis, HTTPS em produção, proteção do banco e força de senha.
     */
    protected function configureDefaults(): void
    {
        // Força a geração de links e assets sob HTTPS quando em produção (ex: atrás do proxy do Railway)
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Usa instâncias imutáveis de data para evitar efeitos colaterais ao manipular datas em memória
        Date::use(CarbonImmutable::class);

        // Bloqueia comandos destrutivos (como migrate:fresh) caso o ambiente seja produção
        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        // Exige senhas fortes em ambiente de produção e facilita testes ágeis no ambiente local
        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
