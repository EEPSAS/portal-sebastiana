<?php

namespace App\Models;

use App\Enums\EmprestimoStatus;
use Carbon\Carbon;
use Database\Factories\EmprestimoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model que representa o empréstimo de livros da biblioteca.
 *
 * @property int $id_emprestimo
 * @property int $livro_id
 * @property int $usuario_id
 * @property Carbon|null $data_emprestimo
 * @property Carbon|null $data_prevista_devolucao
 * @property Carbon|null $data_devolucao_real
 * @property EmprestimoStatus $status
 * @property bool $reserva_ativa
 * @property string|null $observacoes
 * @property-read Livro|null $livro
 * @property-read User|null $usuario
 */
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
        'reserva_ativa',
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
            'reserva_ativa' => 'boolean',
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
