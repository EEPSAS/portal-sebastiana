<?php

namespace App\Traits;

use App\Data\Auditoria\RegistroAcaoData;
use App\Models\RegistroAcao;
use App\Models\User;
use App\Services\RegistroAcaoService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Trait PossuiRegistroAcoes
 *
 * Papel Didático:
 * Conecta qualquer Model Eloquent à tabela polimórfica `registros_acoes`,
 * oferecendo relacionamento ordenado, helper de gravação e serialização segura para API
 * com blindagem RBAC estrita (somente Especialista e Administrador visualizam).
 */
trait PossuiRegistroAcoes
{
    /**
     * Relacionamento 1:N ordenado da ação mais recente para a mais antiga.
     * Converte chaves para string para garantir compatibilidade com PostgreSQL em colunas VARCHAR.
     *
     * @return HasMany<RegistroAcao, $this>
     */
    public function registrosAcoes(): HasMany
    {
        $instance = $this->newRelatedInstance(RegistroAcao::class);
        $query = $instance->newQuery()
            ->where('entidade_tipo', static::class)
            ->orderByDesc('created_at')
            ->orderByDesc('id_registro_acao');

        // Subclasse anônima garante que eager loading e lazy loading enviem strings ao PostgreSQL (VARCHAR)
        return new class($query, $this, $instance->getTable().'.entidade_id', $this->getKeyName()) extends HasMany
        {
            /**
             * Converte a chave do model pai para string na consulta individual.
             */
            public function getParentKey(): ?string
            {
                $valor = parent::getParentKey();

                return $valor !== null ? (string) $valor : null;
            }

            /**
             * Força `whereIn` parametrizado (em vez de `whereIntegerInRaw`) para evitar erro de tipo no PostgreSQL.
             */
            protected function whereInMethod(Model $model, $key): string
            {
                return 'whereIn';
            }

            /**
             * Normaliza todas as chaves coletadas para string no eager loading em lote.
             *
             * @param  array<int, Model>  $models
             * @return array<int, string>
             */
            protected function getKeys(array $models, $key = null): array
            {
                return collect(parent::getKeys($models, $key))
                    ->filter(fn ($valor): bool => $valor !== null && $valor !== '')
                    ->map(fn ($valor): string => (string) $valor)
                    ->values()
                    ->all();
            }
        };
    }

    /**
     * Atalho semântico para registrar uma ação diretamente a partir da instância do Model.
     *
     * @param  array<string, mixed>  $metadados
     */
    public function registrarAcao(
        string $acao,
        string $descricao,
        ?User $executor = null,
        array $metadados = []
    ): ?RegistroAcao {
        return app(RegistroAcaoService::class)->registrar($this, $acao, $descricao, $executor, $metadados);
    }

    /**
     * Retorna `ultima_acao` e `ultimas_acoes` (até 5 registros) apenas para Especialista e Administrador.
     *
     * @return array{ultima_acao: array<string, mixed>|null, ultimas_acoes: array<int, array<string, mixed>>}
     */
    public function obterAuditoriaParaApi(?User $solicitante = null): array
    {
        if ($solicitante === null) {
            $usuarioReq = request()->user();
            $solicitante = $usuarioReq instanceof User ? $usuarioReq : null;
        }

        // Blindagem RBAC: perfis de consulta/aluno não recebem dados de auditoria administrativa
        if ($solicitante === null || (! $solicitante->isAdm() && ! $solicitante->isEspecialista())) {
            return [
                'ultima_acao' => null,
                'ultimas_acoes' => [],
            ];
        }

        $chave = $this->getKey();
        if (! $this->exists || $chave === null || $chave === '') {
            return [
                'ultima_acao' => null,
                'ultimas_acoes' => [],
            ];
        }

        if ($this->relationLoaded('registrosAcoes')) {
            /** @var EloquentCollection<int, RegistroAcao> $relacao */
            $relacao = $this->getRelation('registrosAcoes');
            $colecao = $relacao
                ->sortByDesc(fn (RegistroAcao $r): string => sprintf('%020d_%020d', $r->created_at?->timestamp ?? 0, $r->id_registro_acao))
                ->take(5)
                ->values();
        } else {
            $colecao = $this->registrosAcoes()->limit(5)->get();
        }

        $lista = $colecao
            ->map(fn (RegistroAcao $registro): array => RegistroAcaoData::fromModel($registro)->toArray())
            ->values()
            ->all();

        return [
            'ultima_acao' => $lista[0] ?? null,
            'ultimas_acoes' => $lista,
        ];
    }
}
