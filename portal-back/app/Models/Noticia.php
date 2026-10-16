<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Noticia
 *
 * Conceito Didático:
 * Representa as publicações e informativos institucionais da escola.
 * Utiliza mutators (setters) e accessors (getters) para manter a compatibilidade
 * entre os nomes das colunas legadas do banco ('imagem', 'dataPublicacao')
 * e a convenção moderna da API REST ('url_foto', 'data_publicacao').
 */
class Noticia extends Model
{
    use HasFactory;

    // Define explicitamente o nome da tabela no banco de dados
    protected $table = 'noticias';

    // Lista de atributos liberados para gravação em massa (Mass Assignment)
    protected $fillable = [
        'categoria',
        'titulo',
        'descricao',
        'conteudo',
        'imagem',
        'miniatura',
        'url_foto',
        'url_miniatura',
        'dataPublicacao',
        'data_publicacao',
        'destaque',
        'autor_id',
    ];

    // Converte automaticamente os tipos das colunas no retorno do Eloquent
    protected function casts(): array
    {
        return [
            'dataPublicacao' => 'datetime',
            'data_publicacao' => 'datetime',
            'destaque' => 'boolean',
        ];
    }

    // Mutator: Mapeia o atributo da API 'url_foto' para a coluna 'imagem' no banco
    public function setUrlFotoAttribute(?string $value): void
    {
        $this->attributes['imagem'] = $value;
    }

    // Accessor: Disponibiliza a imagem sob a chave padronizada 'url_foto'
    public function getUrlFotoAttribute(): ?string
    {
        return $this->attributes['imagem'] ?? null;
    }

    // Mutator: Mapeia o atributo da API 'url_miniatura' para a coluna 'miniatura' no banco
    public function setUrlMiniaturaAttribute(?string $value): void
    {
        $this->attributes['miniatura'] = $value;
    }

    // Accessor: Disponibiliza a miniatura sob a chave padronizada 'url_miniatura'
    public function getUrlMiniaturaAttribute(): ?string
    {
        return $this->attributes['miniatura'] ?? null;
    }

    // Mutator: Mapeia 'data_publicacao' para a coluna 'dataPublicacao' no banco
    public function setDataPublicacaoAttribute($value): void
    {
        $this->attributes['dataPublicacao'] = $value;
    }

    // Accessor: Lê a data de publicação da coluna correspondente
    public function getDataPublicacaoAttribute(): mixed
    {
        return $this->attributes['dataPublicacao'] ?? $this->attributes['data_publicacao'] ?? null;
    }

    // Relacionamento N:1 - Cada notícia pertence a um usuário autor (Especialista ou Administrador)
    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autor_id');
    }
}
