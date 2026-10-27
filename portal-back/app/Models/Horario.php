<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Horario extends Model
{
    use HasFactory;

    protected $fillable = [
        'turma_id',
        'ano_letivo',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'ano_letivo' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Turma, $this>
     */
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<HorarioAula, $this>
     */
    public function aulas(): HasMany
    {
        return $this->hasMany(HorarioAula::class)->orderBy('dia_semana')->orderBy('aula_numero');
    }
}
