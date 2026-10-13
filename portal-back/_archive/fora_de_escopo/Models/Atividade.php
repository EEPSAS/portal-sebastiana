<?php

namespace App\Models;

use Database\Factories\AtividadeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Atividade extends Model
{
    /** @use HasFactory<AtividadeFactory> */
    use HasFactory;

    protected $table = 'atividades';

    protected $primaryKey = 'id_atividade';

    protected $fillable = [
        'turma_id',
        'disciplina_id',
        'usuario_id',
        'titulo',
        'descricao_texto',
        'caminho_arquivo_anexo',
        'data_criacao',
        'data_limite_entrega',
        'valor_pontuacao',
        'status_atividade',
    ];

    protected function casts(): array
    {
        return [
            'data_criacao' => 'datetime',
            'data_limite_entrega' => 'datetime',
            'valor_pontuacao' => 'float',
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
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /**
     * @return HasMany<Submissao, $this>
     */
    public function submissoes(): HasMany
    {
        return $this->hasMany(Submissao::class, 'atividade_id', 'id_atividade');
    }

    /**
     * Verifica se o recebimento de submissões está encerrado.
     */
    public function isEncerrada(): bool
    {
        if ($this->status_atividade === 'Encerrada') {
            return true;
        }

        if ($this->data_limite_entrega && Carbon::now()->greaterThan($this->data_limite_entrega)) {
            return true;
        }

        return false;
    }

    /**
     * Verifica se a atividade ainda aceita entregas.
     */
    public function isAberta(): bool
    {
        return ! $this->isEncerrada();
    }
}
