<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Biblioteca
 *
 * Conceito Didático:
 * Armazena preferências e coleções pessoais em formato JSON ('dados') associadas
 * ao usuário logado. O cast 'array' converte automaticamente o JSON do banco
 * para array associativo no PHP e vice-versa.
 */
class Biblioteca extends Model
{
    // Permite atribuição em massa da coluna JSON de preferências
    protected $fillable = ['dados'];

    // Converte automaticamente a coluna 'dados' entre JSON no banco e array no PHP
    protected function casts(): array
    {
        return ['dados' => 'array'];
    }

    // Relacionamento 1:1 inverso - Cada registro de biblioteca pertence a um usuário
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
