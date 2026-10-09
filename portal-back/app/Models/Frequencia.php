<?php

namespace App\Models;

use Database\Factories\FrequenciaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model que representa o registro de frequência e chamada escolar.
class Frequencia extends Model
{
    /** @use HasFactory<FrequenciaFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'frequencias';

    // Chave primária customizada
    protected $primaryKey = 'id_frequencia';

    // Campos preenchíveis em massa
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
    // Conversões de tipo de dados
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
    // Turma em que a aula foi ministrada
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    // Disciplina da chamada
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    // Aluno correspondente ao registro de presença
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsTo<RemessaDocente, $this>
     */
    // Remessa docente de origem do lançamento
    public function remessaOrigem(): BelongsTo
    {
        return $this->belongsTo(RemessaDocente::class, 'remessa_origem_id', 'id_remessa');
    }
}
