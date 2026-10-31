<?php

namespace App\Models;

use Database\Factories\TurmaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'ciclo_id',
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
            'ciclo_id' => 'integer',
            'ano_letivo' => 'integer',
            'capacidade_maxima' => 'integer',
        ];
    }

    /**
     * Relacionamento N:1: Ciclo Escolar ao qual esta turma pertence (ex: 1º Ano, 2º Ano).
     */
    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(Ciclo::class, 'ciclo_id', 'id_ciclo');
    }

    /**
     * Relacionamento N:1: Período Letivo oficial ao qual a turma está vinculada.
     */
    public function periodoLetivo(): BelongsTo
    {
        return $this->belongsTo(PeriodoLetivo::class, 'ano_letivo', 'ano');
    }

    /**
     * Herda automaticamente todas as disciplinas (e professores titulares) do Ciclo da turma.
     */
    public function herdarDisciplinasDoCiclo(): void
    {
        if (! $this->ciclo_id) {
            return;
        }

        $ciclo = $this->ciclo()->with('disciplinas.professores')->first();
        if (! $ciclo) {
            return;
        }

        foreach ($ciclo->disciplinas as $disciplina) {
            $professorPadraoId = $disciplina->professores->first()?->id;

            $alocacao = TurmaDisciplina::firstOrCreate(
                [
                    'turma_id' => $this->id_turma,
                    'disciplina_id' => $disciplina->id_disciplina,
                ],
                [
                    'professor_id' => $professorPadraoId,
                ]
            );

            if ($alocacao->professor_id === null && $professorPadraoId !== null) {
                $alocacao->update(['professor_id' => $professorPadraoId]);
            }
        }
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
    // Alunos matriculados na turma com vínculo ativo
    public function alunos(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'matriculas', 'turma_id', 'usuario_id')
            ->wherePivot('status_matricula', 'Ativo')
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
     * @return HasMany<Horario, $this>
     */
    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class, 'turma_id', 'id_turma');
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
     * @return HasMany<Frequencia, $this>
     */
    // Chamadas e frequências consolidadas via CSV registradas na turma
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'turma_id', 'id_turma');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Notas e avaliações dos alunos da turma consolidadas via CSV
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'turma_id', 'id_turma');
    }
}
