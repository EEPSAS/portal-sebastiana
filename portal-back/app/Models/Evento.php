<?php

namespace App\Models;

use Database\Factories\EventoFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evento extends Model
{
    /** @use HasFactory<EventoFactory> */
    use HasFactory;

    protected $table = 'eventos';

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

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_inicio' => 'date:Y-m-d',
            'data_fim' => 'date:Y-m-d',
            'dia_inteiro' => 'boolean',
            'importante' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criador_id');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeImportantes(Builder $query): Builder
    {
        return $query->where('importante', true);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePorPeriodo(Builder $query, string $inicio, ?string $fim = null): Builder
    {
        if (! $fim) {
            return $query->whereDate('data_inicio', '>=', $inicio);
        }

        return $query->whereBetween('data_inicio', [$inicio, $fim]);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePorMesAno(Builder $query, int|string $mes, int|string $ano): Builder
    {
        return $query->whereMonth('data_inicio', $mes)
            ->whereYear('data_inicio', $ano);
    }
}
