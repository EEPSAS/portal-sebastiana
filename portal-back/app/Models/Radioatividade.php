<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// Removi o BelongsTo pois a sua migration não tinha chave estrangeira (autor_id)

class Radioatividade extends Model // Mudei para Radioatividade para bater com a sua migration
{
    use HasFactory;
    
    // Define o nome exato da tabela criada na sua migration
    protected $table = 'radioatividades'; 

    // Colocamos aqui apenas as colunas que você quer preencher manualmente
    protected $fillable = [
        'titulo', 
        'descricao', 
        'imagem', 
        'duracao'
    ];
}