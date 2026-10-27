<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AlterarPapelRequest;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Requests\UploadAvatarRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

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
        $roleValue = $dados['role'] instanceof UserRole ? $dados['role']->value : (string) $dados['role'];
        // Contas escolares criadas pela gestão também precisam da decisão do Especialista.
        if (in_array($roleValue, [
            UserRole::ALUNO->value,
            UserRole::PADRAO->value,
            UserRole::PROFESSOR->value,
        ], true)) {
            $dados['approval_status'] = 'pending';
        }

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
     * Atualiza dados cadastrais, nickname, telefone, data de nascimento ou senha do usuário.
     */
    public function update(UpdateUsuarioRequest $request, User $usuario): JsonResponse
    {
        $dados = $request->validated();
        $isAdm = $request->user()->hasPermissionTo('gerenciar_usuarios');

        // Remove campo de senha se não tiver sido fornecida
        if (empty($dados['password'])) {
            unset($dados['password']);
        }

        // Remove current_password para não tentar persistir na tabela
        unset($dados['current_password']);

        // Se o usuário não for administrador, impede alteração indevida de papel, status e e-mail
        if (! $isAdm) {
            unset($dados['role_id'], $dados['role'], $dados['ativo'], $dados['email']);
        } else {
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
        }

        $roleValue = $dados['role'] ?? $usuario->role->value;
        $currentRole = $usuario->role instanceof UserRole ? $usuario->role->value : (string) $usuario->role;
        // Mudança de papel ou e-mail escolar invalida sessões e exige nova análise.
        if (in_array($roleValue, [
            UserRole::ALUNO->value,
            UserRole::PADRAO->value,
            UserRole::PROFESSOR->value,
        ], true) && (
            $roleValue !== $currentRole
            || (isset($dados['email']) && $dados['email'] !== $usuario->email)
        )) {
            $dados['approval_status'] = 'pending';
            $usuario->tokens()->delete();
        }

        $usuario->update($dados);

        // Sincroniza automaticamente a data de aniversário com a agenda pessoal do usuário
        if (array_key_exists('data_nascimento', $dados)) {
            $usuario->syncEventoAniversario($dados['data_nascimento']);
        } elseif (array_key_exists('nickname', $dados) || array_key_exists('name', $dados)) {
            // Atualiza o título do evento caso o nome ou apelido tenham mudado
            $usuario->syncEventoAniversario();
        }

        $usuario->load('roleModel.permissions');

        return response()->json(new UsuarioResource($usuario), 200);
    }

    /**
     * Realiza o upload e armazenamento da nova foto de perfil (avatar).
     */
    public function uploadAvatar(UploadAvatarRequest $request, User $usuario): JsonResponse
    {
        // Remove a foto antiga armazenada localmente se existir
        if (! empty($usuario->avatar) && ! str_starts_with($usuario->avatar, 'http') && Storage::disk('public')->exists($usuario->avatar)) {
            Storage::disk('public')->delete($usuario->avatar);
        }

        // Armazena a nova imagem na pasta pública 'avatars'
        $caminho = $request->file('avatar')->store('avatars', 'public');
        $usuario->update(['avatar' => $caminho]);
        $usuario->load('roleModel.permissions');

        return response()->json(new UsuarioResource($usuario), 200);
    }

    /**
     * Remove a foto de perfil (avatar) do usuário.
     */
    public function deleteAvatar(Request $request, User $usuario): JsonResponse
    {
        $isDono = (int) $request->user()->id === (int) $usuario->id;
        $isAdm = $request->user()->hasPermissionTo('gerenciar_usuarios');

        if (! $isDono && ! $isAdm) {
            return response()->json([
                'message' => 'Você não tem permissão para remover a foto deste usuário.',
            ], 403);
        }

        // Exclui o arquivo físico do disco público se não for URL externa
        if (! empty($usuario->avatar) && ! str_starts_with($usuario->avatar, 'http') && Storage::disk('public')->exists($usuario->avatar)) {
            Storage::disk('public')->delete($usuario->avatar);
        }

        $usuario->update(['avatar' => null]);
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
        $dadosPapel = [
            'role_id' => $roleModel?->id,
            'role' => $roleValue,
        ];

        if (in_array($roleValue, [
            UserRole::ALUNO->value,
            UserRole::PADRAO->value,
            UserRole::PROFESSOR->value,
        ], true)) {
            // Uma troca para aluno/professor nunca deve herdar uma aprovação anterior.
            $dadosPapel['approval_status'] = 'pending';
            $usuario->tokens()->delete();
        }

        $usuario->update($dadosPapel);

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
