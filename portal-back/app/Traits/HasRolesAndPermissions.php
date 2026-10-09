<?php

namespace App\Traits;

use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Models\TurmaDisciplina;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasRolesAndPermissions
{
    /**
     * @return BelongsTo<Role, $this>
     */
    public function roleModel(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * @return BelongsToMany<Permission, $this>
     */
    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions', 'user_id', 'permission_id')
            ->withPivot('concedida')
            ->withTimestamps();
    }

    /**
     * Verifica se o usuário possui determinado papel (role).
     */
    public function hasRole(string|array|UserRole $roles): bool
    {
        $roleList = is_array($roles) ? $roles : [$roles];
        $slugs = array_map(fn ($r) => $r instanceof UserRole ? $r->value : (string) $r, $roleList);

        $currentSlug = $this->roleModel?->slug ?? ($this->role instanceof UserRole ? $this->role->value : (string) $this->role);

        return in_array($currentSlug, $slugs, true);
    }

    /**
     * Verifica se o usuário possui determinada permissão/habilidade.
     */
    public function hasPermissionTo(string $permission): bool
    {
        // 1. Administrador possui acesso total (Bypass)
        if ($this->isAdm()) {
            return true;
        }

        // 2. Checagem de sobreposições diretas (Overrides de permissão do usuário)
        $direta = $this->directPermissions->firstWhere('slug', $permission);
        if ($direta !== null) {
            return (bool) $direta->pivot->concedida;
        }

        // 3. Checagem através do papel relacional
        if ($this->roleModel && $this->roleModel->hasPermissionTo($permission)) {
            return true;
        }

        // 4. Fallback baseado no enum legado enquanto role_id não for atribuído
        return $this->fallbackPermissionFromEnum($permission);
    }

    /**
     * Retorna a lista consolidada de slugs de permissões do usuário.
     */
    public function getPermissionsSlugs(): array
    {
        if ($this->isAdm()) {
            return Permission::pluck('slug')->all();
        }

        $fromRole = $this->roleModel ? $this->roleModel->permissions->pluck('slug')->all() : [];
        $revogadas = $this->directPermissions->where('pivot.concedida', false)->pluck('slug')->all();
        $concedidas = $this->directPermissions->where('pivot.concedida', true)->pluck('slug')->all();

        $merged = array_diff($fromRole, $revogadas);
        $merged = array_unique(array_merge($merged, $concedidas));

        return array_values($merged);
    }

    /**
     * Valida se o usuário tem autonomia docente naquela turma e disciplina específicas.
     */
    public function canManageTeachingIn(int $turmaId, int $disciplinaId): bool
    {
        if ($this->isAdm() || $this->hasPermissionTo('gerenciar_turmas')) {
            return true;
        }

        if ($this->hasRole('professor')) {
            return TurmaDisciplina::where('turma_id', $turmaId)
                ->where('disciplina_id', $disciplinaId)
                ->where('professor_id', $this->id)
                ->exists();
        }

        return false;
    }

    /**
     * Checagens semânticas de nível e perfil
     */
    public function isAdm(): bool
    {
        return $this->hasRole(['adm', 'admin']);
    }

    public function isEspecialista(): bool
    {
        return $this->hasRole('especialista');
    }

    public function isProfessor(): bool
    {
        return $this->hasRole('professor');
    }

    public function isBibliotecaria(): bool
    {
        return $this->hasRole('bibliotecaria');
    }

    public function isAluno(): bool
    {
        return $this->hasRole(['aluno', 'padrao']);
    }

    public function isPadrao(): bool
    {
        return $this->isAluno() || $this->isProfessor() || $this->isBibliotecaria();
    }

    private function fallbackPermissionFromEnum(string $permission): bool
    {
        $roleValue = $this->role instanceof UserRole ? $this->role->value : (string) $this->role;

        return match ($roleValue) {
            'especialista' => in_array($permission, [
                'gerenciar_noticias', 'gerenciar_biblioteca', 'gerenciar_turmas',
                'gerenciar_frequencia', 'gerenciar_notas', 'visualizar_relatorios_basicos',
                'gerenciar_livros', 'gerenciar_emprestimos', 'criar_noticia', 'editar_noticia_propria',
                'visualizar_livros', 'solicitar_emprestimo', 'visualizar_emprestimos_proprios',
                'visualizar_eventos', 'criar_evento', 'gerenciar_eventos_proprios', 'gerenciar_eventos',
            ], true),
            'professor' => in_array($permission, [
                'visualizar_livros', 'solicitar_emprestimo', 'visualizar_emprestimos_proprios',
                'criar_noticia', 'editar_noticia_propria', 'criar_videoaula', 'criar_pdf',
                'visualizar_videoaulas', 'visualizar_pdfs', 'baixar_pdfs', 'assistir_videoaulas',
                'enviar_remessa_docente', 'visualizar_eventos', 'criar_evento', 'gerenciar_eventos_proprios',
            ], true),
            'bibliotecaria' => in_array($permission, [
                'visualizar_livros', 'solicitar_emprestimo', 'visualizar_emprestimos_proprios',
                'gerenciar_livros', 'gerenciar_emprestimos', 'visualizar_agenda_devolucoes',
                'visualizar_historico_global_emprestimos', 'visualizar_perfil_basico_usuarios',
                'criar_noticia', 'editar_noticia_propria', 'visualizar_eventos', 'criar_evento', 'gerenciar_eventos_proprios',
            ], true),
            'aluno', 'padrao' => in_array($permission, [
                'visualizar_livros', 'solicitar_emprestimo', 'visualizar_emprestimos_proprios',
                'visualizar_videoaulas', 'visualizar_pdfs', 'baixar_pdfs', 'assistir_videoaulas',
                'criar_noticia', 'editar_noticia_propria', 'visualizar_eventos', 'criar_evento', 'gerenciar_eventos_proprios',
            ], true),
            default => false,
        };
    }
}
