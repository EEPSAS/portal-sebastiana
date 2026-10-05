<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Model que representa episódios e conteúdos da rádio escolar.
class Radioatividade extends Model
{
    use HasFactory;

    // Define o nome exato da tabela no banco de dados
    protected $table = 'radioatividades';

    // Colunas preenchíveis em massa
    protected $fillable = [
        'titulo',
        'descricao',
        'imagem',
        'duracao',
    ];
}
