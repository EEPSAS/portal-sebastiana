<?php

namespace App\Models;

use Database\Factories\PeriodoLetivoFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Model que representa o Período / Ano Letivo Escolar
 *
 * Papel Didático:
 * Centraliza as definições do ano letivo escolar, incluindo seu formato de divisão
 * (bimestral, trimestral ou semestral), sua pontuação global e a vigência ativa.
 */
class PeriodoLetivo extends Model
{
    /** @use HasFactory<PeriodoLetivoFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'periodos_letivos';

    // Chave primária customizada
    protected $primaryKey = 'id_periodo_letivo';

    // Campos permitidos para preenchimento em massa
    protected $fillable = [
        'ano',
        'tipo_divisao',
        'total_pontos',
        'data_inicio',
        'data_fim',
        'ativo',
        'status',
    ];

    /**
     * Conversões automáticas de atributos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ano' => 'integer',
            'total_pontos' => 'float',
            'data_inicio' => 'date:Y-m-d',
            'data_fim' => 'date:Y-m-d',
            'ativo' => 'boolean',
        ];
    }

    /**
     * Relacionamento 1:N com as divisões/etapas do ano letivo (ex: 1º, 2º e 3º Trimestres).
     *
     * @return HasMany<PeriodoLetivoDivisao, $this>
     */
    public function divisoes(): HasMany
    {
        return $this->hasMany(PeriodoLetivoDivisao::class, 'periodo_letivo_id', 'id_periodo_letivo')
            ->orderBy('ordem');
    }

    /**
     * Relacionamento com as turmas pertencentes a este mesmo ano letivo.
     *
     * @return HasMany<Turma, $this>
     */
    public function turmas(): HasMany
    {
        return $this->hasMany(Turma::class, 'ano_letivo', 'ano');
    }

    /**
     * Escopo local para consultar o período letivo atualmente ativo/vigente.
     */
    public function scopeAtivo(Builder $query): Builder
    {
        return $query->where('ativo', true);
    }

    /**
     * Define este período letivo como ativo e inativa os demais em operação transacional.
     */
    public function marcarComoAtivo(): void
    {
        DB::transaction(function () {
            // Desativa todos os períodos letivos previamente ativos
            static::query()->where('ativo', true)->update(['ativo' => false]);

            // Ativa o período atual e define status em andamento se ainda for planejado
            $this->ativo = true;
            if ($this->status === 'planejado') {
                $this->status = 'em_andamento';
            }
            $this->save();
        });
    }

    /**
     * Identifica qual divisão/etapa está em curso com base em uma data informada (ou na data de hoje).
     */
    public function obterDivisaoAtual(?string $dataReferencia = null): ?PeriodoLetivoDivisao
    {
        $hoje = $dataReferencia ? Carbon::parse($dataReferencia) : Carbon::today();

        // 1. Busca por intervalo exato onde hoje está entre data_inicio e data_fim
        $divisao = $this->divisoes->first(function (PeriodoLetivoDivisao $div) use ($hoje) {
            $inicio = Carbon::parse($div->data_inicio)->startOfDay();
            $fim = Carbon::parse($div->data_fim)->endOfDay();

            return $hoje->between($inicio, $fim);
        });

        if ($divisao) {
            return $divisao;
        }

        // 2. Se a data for anterior ao início da primeira divisão, retorna a primeira
        $primeira = $this->divisoes->first();
        if ($primeira && $hoje->lt(Carbon::parse($primeira->data_inicio))) {
            return $primeira;
        }

        // 3. Se a data for posterior ao encerramento, retorna a última divisão
        return $this->divisoes->last();
    }
}
