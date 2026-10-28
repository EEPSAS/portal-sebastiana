<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Eloquent para o histórico de vínculos de um usuário com a escola.
 *
 * Papel Didático:
 * Garante que a inativação/exclusão administrativa de um usuário encerre apenas
 * o vínculo vigente sem apagar seu histórico acadêmico. Caso o usuário retorne
 * futuramente pelo login institucional, um novo registro de vínculo é aberto.
 */
class UsuarioVinculo extends Model
{
    use HasFactory;

    // Define a tabela e a chave primária customizada
    protected $table = 'usuario_vinculos';

    protected $primaryKey = 'id_vinculo';

    // Campos liberados para atribuição em massa
    protected $fillable = [
        'usuario_id',
        'role_no_vinculo',
        'autorizado_por_id',
        'iniciado_em',
        'encerrado_em',
        'encerrado_por_id',
        'observacoes',
    ];

    /**
     * Conversão automática de tipos para objetos Carbon.
     */
    protected function casts(): array
    {
        return [
            'iniciado_em' => 'datetime',
            'encerrado_em' => 'datetime',
        ];
    }

    /**
     * Relacionamento N:1: Usuário a quem pertence este vínculo.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }

    /**
     * Relacionamento N:1: Especialista ou Admin que autorizou o início deste vínculo.
     */
    public function autorizadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autorizado_por_id', 'id');
    }

    /**
     * Relacionamento N:1: Administrador que encerrou este vínculo.
     */
    public function encerradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encerrado_por_id', 'id');
    }
}

