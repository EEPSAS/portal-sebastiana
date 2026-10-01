<?php

namespace App\Models;

use App\Enums\EmprestimoStatus;
use Database\Factories\EmprestimoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Emprestimo extends Model
{
    /** @use HasFactory<EmprestimoFactory> */
    use HasFactory;

    protected $table = 'emprestimos';

    protected $primaryKey = 'id_emprestimo';

    protected $fillable = [
        'livro_id',
        'usuario_id',
        'data_emprestimo',
        'data_prevista_devolucao',
        'data_devolucao_real',
        'status',
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
            'data_emprestimo' => 'datetime',
            'data_prevista_devolucao' => 'datetime',
            'data_devolucao_real' => 'datetime',
            'status' => EmprestimoStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Livro, $this>
     */
    public function livro(): BelongsTo
    {
        return $this->belongsTo(Livro::class, 'livro_id', 'id_livro');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }
}
