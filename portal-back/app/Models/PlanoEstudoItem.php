<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model que representa um item ou conteúdo didático associado a um plano de estudos.
 *
 * Papel Didático:
 * Persiste os metadados do recurso (tipo, título, url, thumbnail, fonte) garantindo
 * acesso direto ao conteúdo original sem depender de chamadas redundantes a APIs externas.
 */
class PlanoEstudoItem extends Model
{
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'plano_estudo_itens';

    // Campos preenchíveis em massa
    protected $fillable = [
        'plano_estudo_id',
        'livro_id',
        'tipo',
        'conteudo_id',
        'titulo',
        'descricao',
        'url',
        'thumbnail',
        'fonte',
        'duracao',
    ];

    /**
     * Plano de estudos ao qual este item pertence.
     */
    public function plano(): BelongsTo
    {
        return $this->belongsTo(PlanoEstudo::class, 'plano_estudo_id', 'id');
    }

    /**
     * Livro físico do acervo escolar associado a este item (quando tipo === 'livro').
     */
    public function livro(): BelongsTo
    {
        return $this->belongsTo(Livro::class, 'livro_id', 'id_livro');
    }
}
