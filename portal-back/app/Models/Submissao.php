<?php

namespace App\Models;

use Database\Factories\SubmissaoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submissao extends Model
{
    /** @use HasFactory<SubmissaoFactory> */
    use HasFactory;

    protected $table = 'submissoes';

    protected $primaryKey = 'id_submissao';

    protected $fillable = [
        'atividade_id',
        'usuario_id',
        'data_envio',
        'texto_resposta',
        'caminho_arquivo_entregue',
        'nota_atribuida',
        'feedback_comentario_professor',
    ];

    protected function casts(): array
    {
        return [
            'data_envio' => 'datetime',
            'nota_atribuida' => 'float',
        ];
    }

    /**
     * @return BelongsTo<Atividade, $this>
     */
    public function atividade(): BelongsTo
    {
        return $this->belongsTo(Atividade::class, 'atividade_id', 'id_atividade');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /**
     * Verifica se o aluno ainda pode editar ou cancelar a submissão.
     */
    public function podeSerModificada(): bool
    {
        return $this->atividade && $this->atividade->isAberta();
    }
}
