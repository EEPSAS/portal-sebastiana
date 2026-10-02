<?php

namespace App\Models;

use Database\Factories\RemessaDocenteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RemessaDocente extends Model
{
    /** @use HasFactory<RemessaDocenteFactory> */
    use HasFactory;

    protected $table = 'remessas_docentes';

    protected $primaryKey = 'id_remessa';

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
    protected function casts(): array
    {
        return [
            'data_envio' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id', 'id');
    }

    /**
     * @return BelongsTo<Turma, $this>
     */
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id', 'id_turma');
    }

    /**
     * @return BelongsTo<Disciplina, $this>
     */
    public function disciplina(): BelongsTo
    {
        return $this->belongsTo(Disciplina::class, 'disciplina_id', 'id_disciplina');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'remessa_origem_id', 'id_remessa');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'remessa_origem_id', 'id_remessa');
    }
}
