<?php

namespace App\Models;

use App\Enums\EmprestimoStatus;
use Database\Factories\EmprestimoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Model que representa o empréstimo de livros da biblioteca.
class Emprestimo extends Model
{
    /** @use HasFactory<EmprestimoFactory> */
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'emprestimos';

    // Chave primária customizada
    protected $primaryKey = 'id_emprestimo';

    // Campos preenchíveis em massa
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
    // Conversões de tipo de dados e enums
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
    // Livro emprestado
    public function livro(): BelongsTo
    {
        return $this->belongsTo(Livro::class, 'livro_id', 'id_livro');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    // Usuário que realizou o empréstimo
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'id');
    }
}
