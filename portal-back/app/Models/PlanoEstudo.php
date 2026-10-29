<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model que representa uma trilha ou plano de estudos personalizado.
 *
 * Papel Didático:
 * Agrupa materiais didáticos (livros, videoaulas, conteúdos web) por disciplina
 * pertencentes a um usuário autenticado, permitindo compartilhamento com turmas
 * quando criado por um professor.
 */
class PlanoEstudo extends Model
{
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'planos_estudos';

    // Campos preenchíveis em massa
    protected $fillable = [
        'user_id',
        'disciplina_id',
        'nome',
        'disciplina',
        'conteudo',
        'descricao',
        'ativo',
    ];

    /**
     * Casts de tipos de atributos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
        ];
    }

    /**
     * Usuário criador / proprietário deste plano.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Componente curricular oficial cadastrado no sistema vinculado a este plano.
     */
    public function disciplinaRelacionada(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * Turmas escolares com as quais este plano de estudos foi compartilhado pelo professor.
     */
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'plano_estudo_turmas', 'plano_estudo_id', 'turma_id')
            ->withTimestamps();
    }

    /**
     * Itens e conteúdos didáticos vinculados a este plano.
     */
    public function itens(): HasMany
    {
        return $this->hasMany(PlanoEstudoItem::class, 'plano_estudo_id', 'id');
    }

    /**
     * Apenas livros vinculados ao plano.
     */
    public function livros(): HasMany
    {
        return $this->itens()->where('tipo', 'livro');
    }

    /**
     * Apenas videoaulas vinculadas ao plano.
     */
    public function videoaulas(): HasMany
    {
        return $this->itens()->where('tipo', 'videoaula');
    }

    /**
     * Apenas conteúdos web vinculados ao plano.
     */
    public function conteudosWeb(): HasMany
    {
        return $this->itens()->where('tipo', 'conteudo_web');
    }
}
