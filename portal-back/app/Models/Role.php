<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Model que representa os perfis de acesso (Roles) do sistema.
class Role extends Model
{
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'roles';

    // Campos preenchíveis em massa
    protected $fillable = [
        'slug',
        'nome',
        'nivel',
        'descricao',
    ];

    // Conversões de tipo de dados
    protected function casts(): array
    {
        return [
            'nivel' => 'integer',
        ];
    }

    /**
     * @return BelongsToMany<Permission, $this>
     */
    // Permissões associadas ao papel
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    /**
     * @return HasMany<User, $this>
     */
    // Usuários com este papel
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }

    // Verifica se o papel possui uma permissão específica
    public function hasPermissionTo(string $permission): bool
    {
        return $this->permissions->contains('slug', $permission);
    }
}
