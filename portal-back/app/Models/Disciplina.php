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
        'carga_horaria_anual',
        'descricao',
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
            'carga_horaria_anual' => 'integer',
        ];
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
     * @return HasMany<RemessaDocente, $this>
     */
    // Remessas enviadas por professores para esta disciplina
    public function remessas(): HasMany
    {
        return $this->hasMany(RemessaDocente::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    // Registros de frequência vinculados à disciplina
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Notas e avaliações lançadas nesta disciplina
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'disciplina_id', 'id_disciplina');
    }
}
