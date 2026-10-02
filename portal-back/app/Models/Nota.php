<?php

namespace App\Models;

use Database\Factories\NotaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Nota extends Model
{
    /** @use HasFactory<NotaFactory> */
    use HasFactory;

    protected $table = 'notas';

    protected $primaryKey = 'id_nota';

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
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsTo<RemessaDocente, $this>
     */
    public function remessaOrigem(): BelongsTo
    {
        return $this->belongsTo(RemessaDocente::class, 'remessa_origem_id', 'id_remessa');
    }
}
