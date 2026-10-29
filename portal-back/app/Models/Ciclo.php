<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Eloquent para os Ciclos Escolares (ex: 1º Ano, 2º Ano, 3º Ano).
 *
 * Papel Didático:
 * O Ciclo agrupa as Disciplinas curriculares daquela etapa de ensino.
 * Quando uma Turma pertence a um Ciclo, ela herda automaticamente todas
 * as disciplinas e respectivos professores vinculados àquele Ciclo.
 */
class Ciclo extends Model
{
    use HasFactory;

    // Define o nome da tabela e a chave primária customizada
    protected $table = 'ciclos';

    protected $primaryKey = 'id_ciclo';

    // Campos liberados para atribuição em massa
    protected $fillable = [
        'nome',
        'descricao',
    ];

    /**
     * Relacionamento N:N: Disciplinas que pertencem a este Ciclo Escolar.
     */
    public function disciplinas(): BelongsToMany
    {
        return $this->belongsToMany(
            Disciplina::class,
            'ciclo_disciplinas',
            'ciclo_id',
            'disciplina_id'
        )->withTimestamps();
    }

    /**
     * Relacionamento 1:N: Turmas vinculadas diretamente a este Ciclo Escolar.
     */
    public function turmas(): HasMany
    {
        return $this->hasMany(Turma::class, 'ciclo_id', 'id_ciclo');
    }

    /**
     * Sincroniza automaticamente as disciplinas deste ciclo para todas as turmas
     * pertencentes a ele, propagando também o professor titular quando houver.
     */
    public function sincronizarDisciplinasNasTurmas(): void
    {
        $disciplinasDoCiclo = $this->disciplinas()->with('professoresTitulares')->get();
        $turmasDoCiclo = $this->turmas()->get();

        foreach ($turmasDoCiclo as $turma) {
            foreach ($disciplinasDoCiclo as $disciplina) {
                // Identifica o professor titular da disciplina (se houver um único ou principal)
                $professorPadraoId = $disciplina->professoresTitulares->first()?->id;

                $alocacao = TurmaDisciplina::firstOrCreate(
                    [
                        'turma_id' => $turma->id_turma,
                        'disciplina_id' => $disciplina->id_disciplina,
                    ],
                    [
                        'professor_id' => $professorPadraoId,
                    ]
                );

                // Se a alocação ainda estava sem professor e a disciplina já possui professor titular, atribui
                if ($alocacao->professor_id === null && $professorPadraoId !== null) {
                    $alocacao->update(['professor_id' => $professorPadraoId]);
                }
            }
        }
    }
}
