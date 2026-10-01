<?php

namespace App\Models;

use Database\Factories\FrequenciaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Frequencia extends Model
{
    /** @use HasFactory<FrequenciaFactory> */
    use HasFactory;

    protected $table = 'frequencias';

    protected $primaryKey = 'id_frequencia';

    protected $fillable = [
        'turma_id',
        'disciplina_id',
        'usuario_id',
        'data_aula',
        'quantidade_aulas',
        'status_presenca',
        'remessa_origem_id',
        'justificativa',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_aula' => 'date:Y-m-d',
            'quantidade_aulas' => 'integer',
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
     * @return BelongsTo<Disciplina, $this>
     */
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsTo<RemessaDocente, $this>
     */
    public function remessaOrigem(): BelongsTo
    {
        return $this->belongsTo(RemessaDocente::class, 'remessa_origem_id', 'id_remessa');
    }
}
