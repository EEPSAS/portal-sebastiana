<?php

namespace App\Models;

use App\Enums\TipoEvento;
use Database\Factories\EventoFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model que representa os eventos do calendário escolar.
class Evento extends Model
{
    /** @use HasFactory<EventoFactory> */
    // Permite criacao de registros via Factory para testes e seeds
    use HasFactory;

    // Nome da tabela associada no banco de dados
    protected $table = 'eventos';

    // Campos permitidos para gravacao em massa
    protected $fillable = [
        'titulo',
        'descricao',
        'data_inicio',
        'data_fim',
        'hora_inicio',
        'hora_fim',
        'dia_inteiro',
        'tipo',
        'importante',
        'local',
        'cor',
        'criador_id',
    ];

    // Converte tipos de dados automaticamente ao recuperar do banco
    protected function casts(): array
    {
        return [
            'data_inicio' => 'date:Y-m-d',
            'data_fim' => 'date:Y-m-d',
            'dia_inteiro' => 'boolean',
            'importante' => 'boolean',
            'tipo' => TipoEvento::class,
        ];
    }

    // Relacionamento com o usuario autor do evento (FK: criador_id)
    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criador_id');
    }

    // Escopo local para filtrar apenas eventos marcados como importantes
    public function scopeImportantes(Builder $query): Builder
    {
        return $query->where('importante', true);
    }

    // Escopo local para filtrar eventos a partir de uma data ou entre duas datas
    public function scopePorPeriodo(Builder $query, string $inicio, ?string $fim = null): Builder
    {
        if (! $fim) {
            return $query->whereDate('data_inicio', '>=', $inicio);
        }

        return $query->whereBetween('data_inicio', [$inicio, $fim]);
    }

    // Escopo local para filtrar eventos de um mes e ano especificos
    public function scopePorMesAno(Builder $query, int|string $mes, int|string $ano): Builder
    {
        return $query->whereMonth('data_inicio', $mes)
            ->whereYear('data_inicio', $ano);
    }
}
