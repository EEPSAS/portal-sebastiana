<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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

    public function biblioteca(): HasOne
    {
        return $this->hasOne(Biblioteca::class);
    }
}
