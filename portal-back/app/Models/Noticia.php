<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model que representa uma notícia publicada no portal.
class Noticia extends Model
{
    use HasFactory;

    // Define a tabela manualmente caso o Laravel procure por 'noticias' no plural em inglês
    protected $table = 'noticias';

    // Campos preenchíveis em massa
    protected $fillable = [
        'categoria',
        'titulo',
        'descricao',
        'conteudo',
        'imagem',
        'miniatura',
        'dataPublicacao',
        'data_publicacao',
        'destaque',
        'autor_id',
    ];

    // Conversões de tipo de dados
    protected function casts(): array
    {
        return [
            'dataPublicacao' => 'datetime',
            'data_publicacao' => 'datetime',
            'destaque' => 'boolean',
        ];
    }

    public function setDataPublicacaoAttribute($value): void
    {
        $this->attributes['dataPublicacao'] = $value;
    }

    public function getDataPublicacaoAttribute(): mixed
    {
        return $this->attributes['dataPublicacao'] ?? $this->attributes['data_publicacao'] ?? null;
    }

    // Relacionamento N:1 com o usuário autor da notícia
    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autor_id');
    }
}
