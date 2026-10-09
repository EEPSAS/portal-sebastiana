<?php

namespace App\Models;

use Database\Factories\MatriculaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model que representa a matrícula de um aluno em uma turma.
class Matricula extends Model
{
    /** @use HasFactory<MatriculaFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'matriculas';

    // Chave primária customizada
    protected $primaryKey = 'id_matricula';

    // Campos preenchíveis em massa
    protected $fillable = [
        'turma_id',
        'usuario_id',
        'data_matricula',
        'status_matricula',
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
            'data_matricula' => 'date:Y-m-d',
        ];
    }

    /**
     * @return BelongsTo<Turma, $this>
     */
    // Turma em que o aluno está matriculado
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    // Aluno matriculado
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }
}
