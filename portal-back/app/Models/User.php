<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
    public function isAdministrador(): bool
    {
        return $this->role === UserRole::ADMINISTRADOR;
    }

    public function isEditor(): bool
    {
        return $this->role === UserRole::EDITOR;
    }

    public function isPadrao(): bool
    {
        return $this->role === UserRole::PADRAO;
    }

    // Permissao para gerenciamento de eventos
    public function canManageEvents(): bool
    {
        return $this->isAdministrador() || $this->isEditor();
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
}