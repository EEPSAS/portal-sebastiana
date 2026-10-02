<?php

namespace App\Models;

use Database\Factories\TurmaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Turma extends Model
{
    /** @use HasFactory<TurmaFactory> */
    use HasFactory;

    protected $table = 'turmas';

    protected $primaryKey = 'id_turma';

    protected $fillable = [
        'nome_identificador',
        'turno',
        'ano_letivo',
        'capacidade_maxima',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ano_letivo' => 'integer',
            'capacidade_maxima' => 'integer',
        ];
    }

    /**
     * @return HasMany<Matricula, $this>
     */
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function alunos(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'matriculas', 'turma_id', 'usuario_id')
            ->withPivot(['id_matricula', 'data_matricula', 'status_matricula'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<TurmaDisciplina, $this>
     */
    public function turmaDisciplinas(): HasMany
    {
        return $this->hasMany(TurmaDisciplina::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsToMany<Disciplina, $this>
     */
    public function disciplinas(): BelongsToMany
    {
        return $this->belongsToMany(Disciplina::class, 'turma_disciplinas', 'turma_id', 'disciplina_id')
            ->withPivot(['id', 'professor_id'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<RemessaDocente, $this>
     */
    public function remessas(): HasMany
    {
        return $this->hasMany(RemessaDocente::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<Atividade, $this>
     */
    public function atividades(): HasMany
    {
        return $this->hasMany(Atividade::class, 'turma_id', 'id_turma');
    }
}
