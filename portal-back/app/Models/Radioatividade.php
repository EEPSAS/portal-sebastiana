<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Radioatividade extends Model
{
    use HasFactory;
    
    // Define o nome exato da tabela
    protected $table = 'radioatividades'; 

    // Colunas a serem preenchidas
    protected $fillable = [
        'titulo', 
        'descricao', 
        'imagem', 
        'duracao'
    ];
}