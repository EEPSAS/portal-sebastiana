<?php

namespace App\Models;

use Database\Factories\DisciplinaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model que representa uma disciplina curricular.
class Disciplina extends Model
{
    /** @use HasFactory<DisciplinaFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'disciplinas';

    // Chave primária customizada
    protected $primaryKey = 'id_disciplina';

    // Campos preenchíveis em massa
    protected $fillable = [
        'nome',
        'aulas_semanais',
        'carga_horaria_anual',
        'descricao',
        'ementa',
        'habilidades_bncc',
        'objetivo_geral',
        'objetivo_especifico',
    ];

    /**
     * Sincroniza automaticamente a quantidade de aulas semanais e a carga horária anual
     * considerando a base oficial de 40 semanas letivas (Item 3.3).
     */
    protected static function booted(): void
    {
        static::saving(function (Disciplina $disciplina) {
            $aulasInformadas = $disciplina->getAttribute('aulas_semanais');
            $cargaInformada = $disciplina->getAttribute('carga_horaria_anual');

            if ($disciplina->isDirty('aulas_semanais') && ! $disciplina->isDirty('carga_horaria_anual') && $aulasInformadas !== null) {
                $disciplina->aulas_semanais = max(1, (int) $aulasInformadas);
                $disciplina->carga_horaria_anual = $disciplina->aulas_semanais * 40;
            } elseif ($disciplina->isDirty('carga_horaria_anual') && ! $disciplina->isDirty('aulas_semanais') && $cargaInformada !== null) {
                $disciplina->carga_horaria_anual = (int) $cargaInformada;
                $disciplina->aulas_semanais = max(1, (int) round($disciplina->carga_horaria_anual / 40));
            } elseif ($aulasInformadas !== null && $cargaInformada !== null) {
                $disciplina->aulas_semanais = max(1, (int) $aulasInformadas);
                $disciplina->carga_horaria_anual = (int) $cargaInformada;
            } elseif ($aulasInformadas !== null) {
                $disciplina->aulas_semanais = max(1, (int) $aulasInformadas);
                $disciplina->carga_horaria_anual = $disciplina->aulas_semanais * 40;
            } elseif ($cargaInformada !== null) {
                $disciplina->carga_horaria_anual = (int) $cargaInformada;
                $disciplina->aulas_semanais = max(1, (int) round($disciplina->carga_horaria_anual / 40));
            } else {
                $disciplina->aulas_semanais = 2;
                $disciplina->carga_horaria_anual = 80;
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    // Conversões de tipo de dados
    protected function casts(): array
    {
        return [
            'aulas_semanais' => 'integer',
            'carga_horaria_anual' => 'integer',
        ];
    }

    /**
     * Ciclos escolares aos quais esta disciplina pertence (ex: 1º Ano, 2º Ano, 3º Ano).
     *
     * @return BelongsToMany<Ciclo, $this>
     */
    public function ciclos(): BelongsToMany
    {
        return $this->belongsToMany(
            Ciclo::class,
            'ciclo_disciplinas',
            'disciplina_id',
            'ciclo_id'
        )->withTimestamps();
    }

    /**
     * @return HasMany<TurmaDisciplina, $this>
     */
    // Vínculos entre turmas, disciplinas e professores
    public function turmaDisciplinas(): HasMany
    {
        return $this->hasMany(TurmaDisciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsToMany<Turma, $this>
     */
    // Turmas que possuem esta disciplina na grade
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'turma_disciplinas', 'disciplina_id', 'turma_id')
            ->withPivot(['id', 'professor_id'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    // Registros de frequência vinculados à disciplina (importados via CSV)
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Notas e avaliações lançadas nesta disciplina (importadas via CSV)
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    // Professores vinculados diretamente a esta disciplina
    public function professores(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'disciplina_professores', 'disciplina_id', 'professor_id')
            ->withTimestamps();
    }

    /**
     * Alias semântico para os professores titulares da disciplina.
     *
     * @return BelongsToMany<User, $this>
     */
    public function professoresTitulares(): BelongsToMany
    {
        return $this->professores();
    }

    /**
     * Propaga esta disciplina para todas as turmas pertencentes aos Ciclos vinculados.
     */
    public function sincronizarComTurmasDosCiclos(): void
    {
        $ciclos = $this->ciclos()->with('turmas')->get();
        $professorPadraoId = $this->professores()->first()?->id;

        foreach ($ciclos as $ciclo) {
            foreach ($ciclo->turmas as $turma) {
                $alocacao = TurmaDisciplina::firstOrCreate(
                    [
                        'turma_id' => $turma->id_turma,
                        'disciplina_id' => $this->id_disciplina,
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
    }
}
