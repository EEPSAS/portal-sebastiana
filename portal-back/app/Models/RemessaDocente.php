<?php

namespace App\Models;

use Database\Factories\RemessaDocenteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model que representa a remessa de dados enviada por professores (frequência/notas).
class RemessaDocente extends Model
{
    /** @use HasFactory<RemessaDocenteFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'remessas_docentes';

    // Chave primária customizada
    protected $primaryKey = 'id_remessa';

    // Campos preenchíveis em massa
    protected $fillable = [
        'professor_id',
        'turma_id',
        'disciplina_id',
        'tipo_dado',
        'arquivo_anexo',
        'data_envio',
        'status_processamento',
        'observacoes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    // Conversões de tipo de dados
    protected function casts(): array
    {
        return [
            'data_envio' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    // Professor autor do envio
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id', 'id');
    }

    /**
     * @return BelongsTo<Turma, $this>
     */
    // Turma vinculada à remessa
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    // Disciplina vinculada à remessa
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    // Registros de frequência consolidados a partir desta remessa
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'remessa_origem_id', 'id_remessa');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Registros de notas lançados a partir desta remessa
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'remessa_origem_id', 'id_remessa');
    }
}
