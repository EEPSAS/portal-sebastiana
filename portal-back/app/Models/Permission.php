<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

// Model que representa uma habilidade ou permissão granular do sistema.
class Permission extends Model
{
    use HasFactory;

    // Tabela associada no banco de dados
    protected $table = 'permissions';

    // Campos preenchíveis em massa
    protected $fillable = [
        'slug',
        'nome',
        'modulo',
        'descricao',
    ];

    /**
     * @return BelongsToMany<Role, $this>
     */
    // Papéis associados a esta permissão
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions', 'permission_id', 'role_id');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    // Usuários com atribuição direta desta permissão
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permissions', 'permission_id', 'user_id')
            ->withPivot('concedida')
            ->withTimestamps();
    }
}
