<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AlterarPapelRequest;
use App\Http\Requests\ConfirmarAlunoVinculoRequest;
use App\Http\Requests\DesvincularUsuarioRequest;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Requests\UploadAvatarRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Matricula;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use App\Services\NotificacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

/**
 * Controller responsável pela gestão administrativa de usuários, bloqueios, vínculos e permissões.
 */
class UsuarioController extends Controller
{
    /**
     * Lista usuários cadastrados com suporte a busca por nome e filtro por Role.
     * Carregamento padrão limitado aos 15 últimos usuários cadastrados (Itens 1.3.1 a 1.3.4).
     *
     * @return JsonResponse Coleção de usuários formatada pelo UsuarioResource
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Ordena pelos últimos usuários cadastrados para exibir os 15 mais recentes por padrão
        $query = User::with(['roleModel', 'autorizadoPor', 'vinculos.autorizadoPor'])
            ->where('status_confirmacao', '!=', 'inativo')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        // Aceita tanto 'busca' quanto 'q' para pesquisa pelo nome/email do usuário (Item 1.3.2)
        $termoBruto = trim($request->string('busca', $request->string('q')->toString())->toString());
        if ($termoBruto !== '') {
            $termo = '%'.$termoBruto.'%';
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

        // Padrão de 15 registros por página conforme Item 1.3.1
        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $usuarios = $query->paginate($perPage);

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
     * Atualiza dados cadastrais, Role, comentário administrativo e emite notificação direta (Item 1.3.8).
     */
    public function update(UpdateUsuarioRequest $request, User $usuario): JsonResponse
    {
        $dados = $request->validated();
        $isAdm = $request->user()->hasPermissionTo('gerenciar_usuarios') || $request->user()->isAdm();

        // Remove campo de senha se não tiver sido fornecida
        if (empty($dados['password'])) {
            unset($dados['password']);
        }

        // Remove current_password para não tentar persistir na tabela
        unset($dados['current_password']);

        // Captura campos de notificação direta antes de atualizar o model User (Item 1.3.8)
        $mensagemNotificacao = trim((string) ($dados['mensagem_notificacao'] ?? ''));
        $tituloNotificacao = trim((string) ($dados['titulo_notificacao'] ?? ''));
        $superImportante = (bool) ($dados['super_importante'] ?? false);
        unset($dados['mensagem_notificacao'], $dados['titulo_notificacao'], $dados['super_importante']);

        // Se o usuário não for administrador, impede alteração indevida de papel, status e e-mail
        if (! $isAdm) {
            unset($dados['role_id'], $dados['role'], $dados['ativo'], $dados['email'], $dados['comentario_admin']);
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

        $usuario->update($dados);

        // Se o administrador preencheu uma mensagem de notificação no modal de edição, dispara-a imediatamente
        if ($isAdm && $mensagemNotificacao !== '') {
            app(NotificacaoService::class)->enviarDiretaParaUsuario(
                $request->user(),
                $usuario,
                $mensagemNotificacao,
                $superImportante,
                $tituloNotificacao !== '' ? $tituloNotificacao : null
            );
        }

        // Sincroniza automaticamente a data de aniversário com a agenda pessoal do usuário
        if (array_key_exists('data_nascimento', $dados)) {
            $usuario->syncEventoAniversario($dados['data_nascimento']);
        } elseif (array_key_exists('nickname', $dados) || array_key_exists('name', $dados)) {
            // Atualiza o título do evento caso o nome ou apelido tenham mudado
            $usuario->syncEventoAniversario();
        }

        $usuario->load(['roleModel.permissions', 'autorizadoPor', 'vinculos.autorizadoPor']);

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
     * Inativa o usuário e encerra seu vínculo atual com a escola sem exclusão em cascata (Itens 1.3.6 e 1.3.7).
     * Força o logoff revogando tokens Sanctum. Caso o usuário faça login novamente no futuro,
     * o cadastro é reaproveitado e encaminhado para a tela de aprovação de login.
     */
    public function destroy(DesvincularUsuarioRequest $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        if ($usuario->id === $request->user()->id) {
            return response()->json([
                'message' => 'Você não pode excluir a sua própria conta de administrador.',
            ], 422);
        }

        // Se o nome de confirmação em 2 etapas foi enviado, exige correspondência exata (estilo GitHub)
        if ($request->filled('confirmacao_nome')) {
            $nomeConfirmado = mb_strtolower(trim($request->string('confirmacao_nome')->toString()));
            $nomeReal = mb_strtolower(trim($usuario->name));

            if ($nomeConfirmado !== $nomeReal) {
                return response()->json([
                    'message' => 'O nome digitado não corresponde exatamente ao nome completo do usuário.',
                ], 422);
            }
        }

        // 1. Força o logoff imediato do usuário revogando todos os tokens ativos
        $usuario->tokens()->delete();

        // 2. Encerra o vínculo aberto no histórico sem apagar registros anteriores
        $usuario->vinculos()
            ->whereNull('encerrado_em')
            ->update([
                'encerrado_em' => now(),
                'encerrado_por_id' => $request->user()->id,
                'observacoes' => 'Vínculo encerrado administrativamente pelo Controle de Usuários.',
            ]);

        // 3. Inativa matrículas ativas e libera alocações docentes atuais preservando notas e históricos
        $usuario->matriculas()
            ->where('status_matricula', 'Ativo')
            ->update(['status_matricula' => 'Inativo']);

        TurmaDisciplina::where('professor_id', $usuario->id)->update(['professor_id' => null]);

        // 4. Marca o usuário como inativo/desvinculado para que um futuro login gere novo vínculo pendente
        $usuario->update([
            'ativo' => false,
            'status_confirmacao' => 'inativo',
        ]);

        return response()->json([
            'message' => "Vínculo do usuário {$usuario->name} encerrado com sucesso. O histórico acadêmico foi preservado.",
        ], 200);
    }

    /**
     * Retorna o resumo de aprovações de login pendentes (Alunos e Professores)
     * para alimentar os badges do Aside e os painéis de vínculo (Itens 2.3 e 2.4).
     */
    public function pendentesResumo(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->canManageAcademic() && ! $user->isAdm() && ! $user->isEspecialista())) {
            return response()->json(['message' => 'Acesso não autorizado.'], 403);
        }

        $professoresPendentes = User::where('role', UserRole::PROFESSOR)
            ->where('status_confirmacao', 'pendente')
            ->count();

        $alunosPendentesQuery = User::where('role', UserRole::ALUNO)
            ->where('status_confirmacao', 'pendente')
            ->orderByDesc('created_at');

        $alunosPendentesCount = (clone $alunosPendentesQuery)->count();
        $alunosPendentesLista = $alunosPendentesQuery->limit(50)->get();

        return response()->json([
            'professores_pendentes' => $professoresPendentes,
            'alunos_pendentes' => $alunosPendentesCount,
            'total_pendentes' => $professoresPendentes + $alunosPendentesCount,
            'alunos_lista' => UsuarioResource::collection($alunosPendentesLista),
        ], 200);
    }

    /**
     * Aprova o login de um Aluno pendente vinculando-o obrigatoriamente a uma Turma da escola (Item 2.3.1).
     */
    public function confirmarVinculoAluno(ConfirmarAlunoVinculoRequest $request, User $usuario): JsonResponse
    {
        if (! $usuario->isAluno()) {
            return response()->json([
                'message' => 'O usuário selecionado não possui perfil de Aluno.',
            ], 422);
        }

        $turma = Turma::findOrFail($request->validated('turma_id'));

        // Inativa eventuais matrículas anteriores e ativa a matrícula na turma escolhida
        Matricula::where('usuario_id', $usuario->id)
            ->where('turma_id', '!=', $turma->id_turma)
            ->where('status_matricula', 'Ativo')
            ->update(['status_matricula' => 'Transferido']);

        Matricula::updateOrCreate(
            [
                'usuario_id' => $usuario->id,
                'turma_id' => $turma->id_turma,
            ],
            [
                'data_matricula' => now()->toDateString(),
                'status_matricula' => 'Ativo',
            ]
        );

        // Registra o vínculo escolar e aprova o acesso do aluno
        $usuario->registrarVinculoEscolar(
            $request->user()->id,
            "Aprovado e vinculado à turma {$turma->nome_identificador}"
        );

        $usuario->load(['turmas', 'autorizadoPor', 'vinculos.autorizadoPor']);

        return response()->json([
            'message' => "Aluno(a) {$usuario->name} aprovado(a) e vinculado(a) à turma {$turma->nome_identificador} com sucesso!",
            'data' => new UsuarioResource($usuario),
        ], 200);
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
