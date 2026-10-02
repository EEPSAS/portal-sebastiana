<?php

namespace App\Models;

use Database\Factories\DisciplinaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Disciplina extends Model
{
    /** @use HasFactory<DisciplinaFactory> */
    use HasFactory;

    protected $table = 'disciplinas';

    protected $primaryKey = 'id_disciplina';

    protected $fillable = [
        'nome',
        'carga_horaria_anual',
        'descricao',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'carga_horaria_anual' => 'integer',
        ];
    }

    /**
     * @return HasMany<TurmaDisciplina, $this>
     */
    public function turmaDisciplinas(): HasMany
    {
        return $this->hasMany(TurmaDisciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsToMany<Turma, $this>
     */
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'turma_disciplinas', 'disciplina_id', 'turma_id')
            ->withPivot(['id', 'professor_id'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<RemessaDocente, $this>
     */
    public function remessas(): HasMany
    {
        return $this->hasMany(RemessaDocente::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Atividade, $this>
     */
    public function atividades(): HasMany
    {
        return $this->hasMany(Atividade::class, 'disciplina_id', 'id_disciplina');
    }
}
