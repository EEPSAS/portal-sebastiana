<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorarioAula extends Model
{
    use HasFactory;

    protected $fillable = [
        'horario_id',
        'dia_semana',
        'aula_numero',
        'disciplina_id',
        'professor_id',
    ];

    protected function casts(): array
    {
        return [
            'dia_semana' => 'integer',
            'aula_numero' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Horario, $this>
     */
    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class);
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }
}
