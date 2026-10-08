<?php

namespace App\Models;

use Database\Factories\NotaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model que representa a nota ou avaliação acadêmica de um aluno.
class Nota extends Model
{
    /** @use HasFactory<NotaFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'notas';

    // Chave primária customizada
    protected $primaryKey = 'id_nota';

    // Campos preenchíveis em massa
    protected $fillable = [
        'turma_id',
        'disciplina_id',
        'usuario_id',
        'periodo_letivo',
        'tipo_avaliacao',
        'valor_nota',
        'valor_maximo',
        'data_registro',
        'remessa_origem_id',
        'observacoes',
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
            'valor_nota' => 'float',
            'valor_maximo' => 'float',
            'data_registro' => 'date:Y-m-d',
        ];
    }

    /**
     * @return BelongsTo<Turma, $this>
     */
    // Turma vinculada à avaliação
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    // Disciplina da avaliação
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    // Aluno avaliado
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
