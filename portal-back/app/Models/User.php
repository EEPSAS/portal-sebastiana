<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// Campos permitidos para gravacao em massa
#[Fillable(['name', 'email', 'password', 'role'])]
// Campos ocultos na serializacao
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    // Autenticacao via API, criacao por factory e notificacoes
    use HasApiTokens, HasFactory, Notifiable;

    // Conversoes de tipos de atributos
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    // Checagens de nivel de acesso
    public function isAdm(): bool
    {
        return $this->role === UserRole::ADM;
    }

    public function isEspecialista(): bool
    {
        return $this->role === UserRole::ESPECIALISTA;
    }

    public function isPadrao(): bool
    {
        return $this->role === UserRole::PADRAO;
    }

    // Permissao para gerenciamento de conteudo (eventos, noticias)
    public function canManageEvents(): bool
    {
        return $this->isAdm() || $this->isEspecialista();
    }

    // Permissao para gerenciamento de biblioteca (livros e emprestimos)
    public function canManageLibrary(): bool
    {
        return $this->isAdm() || $this->isEspecialista();
    }

    // Permissao para gerenciamento acadêmico (turmas, notas, frequencias)
    public function canManageAcademic(): bool
    {
        return $this->isAdm() || $this->isEspecialista();
    }

    // Relacionamento com as noticias criadas
    public function noticias(): HasMany
    {
        return $this->hasMany(Noticia::class, 'autor_id');
    }

    // Relacionamento com os eventos criados
    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'criador_id');
    }

    /**
     * @return HasMany<Emprestimo, $this>
     */
    public function emprestimos(): HasMany
    {
        return $this->hasMany(Emprestimo::class, 'usuario_id');
    }

    /**
     * @return HasMany<Matricula, $this>
     */
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsToMany<Turma, $this>
     */
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'matriculas', 'usuario_id', 'turma_id')
            ->withPivot(['id_matricula', 'data_matricula', 'status_matricula'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<RemessaDocente, $this>
     */
    public function remessas(): HasMany
    {
        return $this->hasMany(RemessaDocente::class, 'professor_id', 'id');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'usuario_id', 'id');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'usuario_id', 'id');
    }

    /**
     * @return HasMany<Atividade, $this>
     */
    public function atividadesCriadas(): HasMany
    {
        return $this->hasMany(Atividade::class, 'usuario_id', 'id');
    }

    /**
     * @return HasMany<Submissao, $this>
     */
    public function submissoes(): HasMany
    {
        return $this->hasMany(Submissao::class, 'usuario_id', 'id');
    }
}
