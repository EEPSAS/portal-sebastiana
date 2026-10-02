<?php

namespace App\Models;

use Database\Factories\LivroFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Livro extends Model
{
    /** @use HasFactory<LivroFactory> */
    use HasFactory;

    protected $table = 'livros';

    protected $primaryKey = 'id_livro';

    protected $fillable = [
        'titulo',
        'capa',
        'autor',
        'editora',
        'data_publicacao',
        'prateleira_localizacao',
        'genero',
        'quantidade_total',
        'quantidade_disponivel',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data_publicacao' => 'date:Y-m-d',
            'quantidade_total' => 'integer',
            'quantidade_disponivel' => 'integer',
        ];
    }

    /**
     * @return HasMany<Emprestimo, $this>
     */
    public function emprestimos(): HasMany
    {
        return $this->hasMany(Emprestimo::class, 'livro_id', 'id_livro');
    }

    public function verificarDisponibilidade(): bool
    {
        return $this->quantidade_disponivel > 0;
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeDisponiveis(Builder $query): Builder
    {
        return $query->where('quantidade_disponivel', '>', 0);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeBuscar(Builder $query, string $termo): Builder
    {
        return $query->where(function (Builder $q) use ($termo) {
            $q->where('titulo', 'like', "%{$termo}%")
                ->orWhere('autor', 'like', "%{$termo}%")
                ->orWhere('genero', 'like', "%{$termo}%")
                ->orWhere('editora', 'like', "%{$termo}%");
        });
    }
}
