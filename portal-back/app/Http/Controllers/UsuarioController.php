<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pela administração de usuários, bloqueios e atribuição de papéis/permissões.
class UsuarioController extends Controller
{
    // Lista usuários cadastrados com paginação e filtros por termo de busca, papel e status.
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        $query = User::with(['roleModel'])->orderBy('name');

        if ($request->filled('q')) {
            $termo = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($termo) {
                $q->where('name', 'like', $termo)
                    ->orWhere('email', 'like', $termo);
            });
        }

        if ($request->filled('role')) {
            $roleSlug = $request->string('role')->toString();
            $query->where(function ($q) use ($roleSlug) {
                $q->whereHas('roleModel', fn ($r) => $r->where('slug', $roleSlug))
                    ->orWhere('role', $roleSlug);
            });
        }

        if ($request->has('ativo')) {
            $query->where('ativo', $request->boolean('ativo'));
        }

        $usuarios = $query->paginate($request->integer('per_page', 20));

        return response()->json($usuarios, 200);
    }

    // Cadastra um novo usuário no sistema.
    public function store(StoreUsuarioRequest $request): JsonResponse
    {
        $dados = $request->validated();

        $roleModel = null;
        if (! empty($dados['role_id'])) {
            $roleModel = Role::find($dados['role_id']);
        } elseif (! empty($dados['role'])) {
            $roleModel = Role::where('slug', $dados['role'])->first();
        }

        if ($roleModel) {
            $dados['role_id'] = $roleModel->id;
            $dados['role'] = $roleModel->slug;
        } else {
            $dados['role'] = UserRole::PADRAO;
        }

        $dados['ativo'] = $dados['ativo'] ?? true;

        $usuario = User::create($dados);

        return response()->json(
            $usuario->load('roleModel.permissions'),
            201
        );
    }

    // Exibe detalhes cadastrais, papel e permissões ativas de um usuário.
    public function show(User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        $usuario->load(['roleModel.permissions', 'directPermissions']);

        $dados = $usuario->toArray();
        $dados['permissoes'] = $usuario->getPermissionsSlugs();

        return response()->json($dados, 200);
    }

    // Atualiza dados cadastrais, senha ou papel do usuário.
    public function update(UpdateUsuarioRequest $request, User $usuario): JsonResponse
    {
        $dados = $request->validated();

        if (empty($dados['password'])) {
            unset($dados['password']);
        }

        if (! empty($dados['role_id'])) {
            $roleModel = Role::find($dados['role_id']);
            if ($roleModel) {
                $dados['role'] = $roleModel->slug;
            }
        } elseif (! empty($dados['role'])) {
            $roleModel = Role::where('slug', $dados['role'])->first();
            if ($roleModel) {
                $dados['role_id'] = $roleModel->id;
            }
        }

        $usuario->update($dados);

        return response()->json(
            $usuario->load('roleModel.permissions'),
            200
        );
    }

    // Alterna o status do usuário entre ativo e bloqueado, revogando tokens se bloqueado.
    public function bloquear(Request $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        if ($usuario->id === $request->user()->id) {
            return response()->json([
                'message' => 'Você não pode bloquear a sua própria conta de administrador.',
            ], 422);
        }

        $novoStatus = $request->has('ativo')
            ? $request->boolean('ativo')
            : ! $usuario->ativo;

        $usuario->update(['ativo' => $novoStatus]);

        // Se bloqueado, desconecta todas as sessões ativas imediatamente
        if (! $novoStatus) {
            $usuario->tokens()->delete();
        }

        return response()->json([
            'message' => $novoStatus ? 'Usuário desbloqueado com sucesso.' : 'Usuário bloqueado com sucesso.',
            'usuario' => $usuario->only(['id', 'name', 'email', 'ativo']),
        ], 200);
    }

    // Altera o papel (Role) atribuído ao usuário.
    public function alterarPapel(Request $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $validated = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'exists:roles,slug'],
        ]);

        $roleModel = null;
        if (! empty($validated['role_id'])) {
            $roleModel = Role::findOrFail($validated['role_id']);
        } elseif (! empty($validated['role'])) {
            $roleModel = Role::where('slug', $validated['role'])->firstOrFail();
        } else {
            return response()->json(['message' => 'Informe o role_id ou o slug do papel.'], 422);
        }

        $usuario->update([
            'role_id' => $roleModel->id,
            'role' => $roleModel->slug,
        ]);

        return response()->json([
            'message' => "Papel do usuário alterado com sucesso para {$roleModel->nome}.",
            'usuario' => $usuario->load('roleModel.permissions'),
        ], 200);
    }

    // Exclui o usuário do sistema e revoga seus tokens de acesso.
    public function destroy(Request $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        if ($usuario->id === $request->user()->id) {
            return response()->json([
                'message' => 'Você não pode excluir a sua própria conta de administrador.',
            ], 422);
        }

        $usuario->tokens()->delete();
        $usuario->delete();

        return response()->json(null, 204);
    }

    // Lista todos os papéis e suas permissões associadas.
    public function papeis(): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $papeis = Role::with('permissions')
            ->orderBy('nivel')
            ->get();

        return response()->json($papeis, 200);
    }

    // Lista todas as permissões cadastradas no sistema agrupadas por módulo.
    public function permissoes(): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $permissoes = Permission::orderBy('modulo')
            ->orderBy('slug')
            ->get();

        return response()->json($permissoes, 200);
    }

    // Atribui ou revoga permissões individuais diretamente ao usuário.
    public function atribuirPermissoes(Request $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $validated = $request->validate([
            'permissoes' => ['required', 'array'],
            'permissoes.*.permission' => ['required', 'string', 'exists:permissions,slug'],
            'permissoes.*.concedida' => ['required', 'boolean'],
        ]);

        foreach ($validated['permissoes'] as $item) {
            $permission = Permission::where('slug', $item['permission'])->first();
            if ($permission) {
                $usuario->directPermissions()->syncWithoutDetaching([
                    $permission->id => ['concedida' => $item['concedida']],
                ]);
            }
        }

        $usuario->load(['roleModel.permissions', 'directPermissions']);

        return response()->json([
            'message' => 'Permissões do usuário atualizadas com sucesso.',
            'usuario_id' => $usuario->id,
            'permissoes' => $usuario->getPermissionsSlugs(),
        ], 200);
    }
}
