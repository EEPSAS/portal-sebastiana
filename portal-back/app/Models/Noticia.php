<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Noticia extends Model
{
    use HasFactory;
    // Define a tabela manualmente caso o Laravel procure por 'noticias' no plural em inglês
    protected $table = 'noticias'; 

    protected $fillable = [
        'categoria',
        'titulo', 
        'descricao',
        'conteudo', 
        'imagem',
        'miniatura',
        'dataPublicacao', 
        'autor_id'
    ];

    protected function casts(): array
    {
        return [
            'dataPublicacao' => 'datetime',
            'destaque' => 'boolean',
        ];
    }

    // Relacionamento N:1 (Inverso)
    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autor_id');
    }
}
