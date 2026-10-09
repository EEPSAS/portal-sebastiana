<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Traits\HasRolesAndPermissions;
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
#[Fillable(['name', 'email', 'password', 'role', 'role_id', 'ativo'])]
// Campos ocultos na serializacao
#[Hidden(['password', 'remember_token'])]
// Model de usuário autenticável do sistema.
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    // Autenticacao via API, criacao por factory e notificacoes
    use HasApiTokens, HasFactory, HasRolesAndPermissions, Notifiable;

    // Conversoes de tipos de atributos
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'ativo' => 'boolean',
        ];
    }

    // Permissao para gerenciamento de conteudo (eventos, noticias)
    public function canManageEvents(): bool
    {
        return $this->isAdm() || $this->hasPermissionTo('gerenciar_noticias') || $this->isEspecialista();
    }

    // Permissao para gerenciamento de biblioteca (livros e emprestimos)
    public function canManageLibrary(): bool
    {
        return $this->isAdm()
            || $this->hasPermissionTo('gerenciar_livros')
            || $this->hasPermissionTo('gerenciar_emprestimos')
            || $this->hasPermissionTo('gerenciar_biblioteca');
    }

    // Permissao para gerenciamento acadêmico (turmas, notas, frequencias)
    public function canManageAcademic(): bool
    {
        return $this->isAdm()
            || $this->hasPermissionTo('gerenciar_turmas')
            || $this->hasPermissionTo('gerenciar_notas')
            || $this->hasPermissionTo('gerenciar_frequencia')
            || $this->isEspecialista();
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
    // Histórico de empréstimos solicitados pelo usuário
    public function emprestimos(): HasMany
    {
        return $this->hasMany(Emprestimo::class, 'usuario_id');
    }

    /**
     * @return HasMany<Matricula, $this>
     */
    // Matrículas escolares do aluno
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsToMany<Turma, $this>
     */
    // Turmas em que o aluno está matriculado
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'matriculas', 'usuario_id', 'turma_id')
            ->withPivot(['id_matricula', 'data_matricula', 'status_matricula'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<RemessaDocente, $this>
     */
    // Remessas enviadas pelo professor
    public function remessas(): HasMany
    {
        return $this->hasMany(RemessaDocente::class, 'professor_id', 'id');
    }

    /**
     * @return HasMany<Frequencia, $this>
     */
    // Registros de frequência do aluno
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'usuario_id', 'id');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Registros de notas e avaliações do aluno
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
