<?php

namespace App\Models;

use Database\Factories\TurmaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model que representa uma turma escolar.
class Turma extends Model
{
    /** @use HasFactory<TurmaFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'turmas';

    // Chave primária customizada
    protected $primaryKey = 'id_turma';

    // Campos preenchíveis em massa
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
    // Conversões de tipo de dados
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
    // Matrículas realizadas nesta turma
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    // Alunos matriculados na turma
    public function alunos(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'matriculas', 'turma_id', 'usuario_id')
            ->withPivot(['id_matricula', 'data_matricula', 'status_matricula'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<TurmaDisciplina, $this>
     */
    // Vínculos entre turma, disciplinas e professores
    public function turmaDisciplinas(): HasMany
    {
        return $this->hasMany(TurmaDisciplina::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsToMany<Disciplina, $this>
     */
    // Disciplinas ministradas nesta turma
    public function disciplinas(): BelongsToMany
    {
        return $this->belongsToMany(Disciplina::class, 'turma_disciplinas', 'turma_id', 'disciplina_id')
            ->withPivot(['id', 'professor_id'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<RemessaDocente, $this>
     */
    // Remessas enviadas por professores para esta turma
    public function remessas(): HasMany
    {
        return $this->hasMany(RemessaDocente::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    // Chamadas e frequências registradas na turma
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Notas e avaliações dos alunos da turma
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'turma_id', 'id_turma');
    }
}
