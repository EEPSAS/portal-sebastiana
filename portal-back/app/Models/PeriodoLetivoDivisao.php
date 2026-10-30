<?php

namespace App\Models;

use Database\Factories\PeriodoLetivoDivisaoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Model que representa uma Divisão / Etapa Avaliativa do Período Letivo
 *
 * Papel Didático:
 * Representa bimestres, trimestres ou semestres individuais, guardando a fatia
 * de pontuação atribuída àquela etapa e o intervalo de datas letivas oficial.
 */
class PeriodoLetivoDivisao extends Model
{
    /** @use HasFactory<PeriodoLetivoDivisaoFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'periodo_letivo_divisoes';

    // Chave primária customizada
    protected $primaryKey = 'id_divisao';

    // Campos permitidos para preenchimento em massa
    protected $fillable = [
        'periodo_letivo_id',
        'numero',
        'nome',
        'pontos',
        'data_inicio',
        'data_fim',
        'ordem',
    ];

    /**
     * Conversões automáticas de atributos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'numero' => 'integer',
            'pontos' => 'float',
            'data_inicio' => 'date:Y-m-d',
            'data_fim' => 'date:Y-m-d',
            'ordem' => 'integer',
        ];
    }

    /**
     * Relacionamento N:1 com o Período Letivo pai.
     *
     * @return BelongsTo<PeriodoLetivo, $this>
     */
    public function periodoLetivo(): BelongsTo
    {
        return $this->belongsTo(PeriodoLetivo::class, 'periodo_letivo_id', 'id_periodo_letivo');
    }

    /**
     * Verifica se esta divisão específica está em andamento na data informada ou atual.
     */
    public function isVigente(?string $dataReferencia = null): bool
    {
        $hoje = $dataReferencia ? Carbon::parse($dataReferencia) : Carbon::today();
        $inicio = Carbon::parse($this->data_inicio)->startOfDay();
        $fim = Carbon::parse($this->data_fim)->endOfDay();

        return $hoje->between($inicio, $fim);
    }
}
