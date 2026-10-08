<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model pivô que vincula turma, disciplina e professor responsável.
class TurmaDisciplina extends Model
{
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'turma_disciplinas';

    // Campos preenchíveis em massa
    protected $fillable = [
        'turma_id',
        'disciplina_id',
        'professor_id',
    ];

    /**
     * @return BelongsTo<Turma, $this>
     */
    // Turma vinculada
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    // Disciplina vinculada
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    // Professor responsável
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id', 'id');
    }
}
