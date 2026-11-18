<?php

namespace App\Models;

use Database\Factories\RegistroAcaoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Model Eloquent que representa um registro histórico de ação executada sobre uma entidade.
 *
 * Papel Didático:
 * Centraliza a trilha de auditoria do portal armazenando o alvo (`entidade_tipo` + `entidade_id`),
 * a descrição legível da mudança e o snapshot do usuário executor.
 *
 * @property int $id_registro_acao
 * @property string $entidade_tipo
 * @property string $entidade_id
 * @property string $acao
 * @property string $descricao
 * @property int|null $executado_por_id
 * @property string $executado_por_nome
 * @property string $executado_por_role
 * @property array<string, mixed>|null $metadados
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class RegistroAcao extends Model
{
    /** @use HasFactory<RegistroAcaoFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'registros_acoes';

    // Chave primária customizada conforme padrão do módulo acadêmico
    protected $primaryKey = 'id_registro_acao';

    // Campos liberados para atribuição em massa
    protected $fillable = [
        'entidade_tipo',
        'entidade_id',
        'acao',
        'descricao',
        'executado_por_id',
        'executado_por_nome',
        'executado_por_role',
        'metadados',
    ];

    /**
     * Conversões automáticas de atributos ao ler/gravar no banco.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'executado_por_id' => 'integer',
            'metadados' => 'array',
        ];
    }

    /**
     * Usuário que executou a ação (pode ser nulo caso a conta tenha sido excluída posteriormente).
     *
     * @return BelongsTo<User, $this>
     */
    public function executadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executado_por_id', 'id');
    }
}
