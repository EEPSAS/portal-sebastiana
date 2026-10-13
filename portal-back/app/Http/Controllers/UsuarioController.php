<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AlterarPapelRequest;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pela gestão administrativa de usuários, bloqueios e permissões.
 */
class UsuarioController extends Controller
{
    /**
     * Lista usuários cadastrados com suporte a busca e filtros por papel e status.
     *
     * @return JsonResponse Coleção de usuários formatada pelo UsuarioResource
     */
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

        return response()->json(UsuarioResource::collection($usuarios)->response()->getData(true), 200);
    }

    /**
     * Cria e cadastra um novo usuário no sistema administrativo.
     */
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
            $dados['role'] = UserRole::ALUNO;
        }

        $dados['ativo'] = $dados['ativo'] ?? true;

        $usuario = User::create($dados);
        $usuario->load('roleModel.permissions');

        return response()->json(new UsuarioResource($usuario), 201);
    }

    /**
     * Exibe os detalhes cadastrais, papel e permissões ativas de um usuário.
     */
    public function show(User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        $usuario->load(['roleModel.permissions', 'directPermissions']);

        return response()->json(new UsuarioResource($usuario), 200);
    }

    /**
     * Atualiza dados cadastrais, senha ou papel do usuário.
     */
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
        $usuario->load('roleModel.permissions');

        return response()->json(new UsuarioResource($usuario), 200);
    }

    /**
     * Alterna o status do usuário entre ativo e inativo (bloqueado).
     */
    public function bloquear(Request $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Impede que o próprio administrador se bloqueie
        if ($usuario->id === $request->user()->id) {
            return response()->json([
                'message' => 'Você não pode bloquear a sua própria conta de administrador.',
            ], 422);
        }

        $novoStatus = $request->has('ativo')
            ? $request->boolean('ativo')
            : ! $usuario->ativo;

        $usuario->update(['ativo' => $novoStatus]);

        // Revoga os tokens de acesso se a conta for inativada
        if (! $novoStatus) {
            $usuario->tokens()->delete();
        }

        return response()->json([
            'message' => $novoStatus ? 'Usuário desbloqueado com sucesso.' : 'Usuário bloqueado com sucesso.',
            'usuario' => new UsuarioResource($usuario),
        ], 200);
    }

    /**
     * Altera o papel institucional do usuário utilizando Form Request com enum UserRole.
     */
    public function alterarPapel(AlterarPapelRequest $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $validated = $request->validated();
        $roleValue = $validated['role'];

        $roleModel = Role::where('slug', $roleValue)->first();

        $usuario->update([
            'role_id' => $roleModel?->id,
            'role' => $roleValue,
        ]);

        $usuario->load('roleModel.permissions');

        return response()->json([
            'message' => "Papel do usuário alterado com sucesso para {$roleValue}.",
            'usuario' => new UsuarioResource($usuario),
        ], 200);
    }

    /**
     * Remove um usuário do sistema escolar e revoga seus tokens.
     *
     * @return JsonResponse Retorno HTTP 204
     */
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

    /**
     * Retorna a lista de papéis e suas permissões associadas.
     */
    public function papeis(): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $papeis = Role::with('permissions')->orderBy('nivel')->get();

        return response()->json($papeis, 200);
    }

    /**
     * Retorna a lista de permissões disponíveis no sistema.
     */
    public function permissoes(): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        $permissoes = Permission::orderBy('modulo')->orderBy('slug')->get();

        return response()->json($permissoes, 200);
    }

    /**
     * Atribui ou revoga permissões específicas diretamente ao usuário.
     */
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
            'usuario' => new UsuarioResource($usuario),
        ], 200);
    }
}
