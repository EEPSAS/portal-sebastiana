<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AlterarPapelRequest;
use App\Http\Requests\AtribuirPermissoesUsuarioRequest;
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
use App\Services\RegistroAcaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

/**
 * Controller responsável pela gestão administrativa de usuários, bloqueios, vínculos e permissões.
 */
class UsuarioController extends Controller
{
    /**
     * Lista usuários cadastrados com suporte a busca por nome e filtro por Role.
     * Exibe todos os usuários cadastrados (mesmo sem pendências, com pendências ou aguardando aprovação).
     *
     * @return JsonResponse Coleção de usuários formatada pelo UsuarioResource
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        // Ordena pelos últimos usuários cadastrados para exibir os mais recentes por padrão
        $query = User::with(['roleModel', 'autorizadoPor', 'vinculos.autorizadoPor', 'registrosAcoes'])
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
            $roleSlug = mb_strtolower(trim($request->string('role')->toString()));
            $slugsBusca = match ($roleSlug) {
                UserRole::ADM->value, 'admin', 'administrador' => [UserRole::ADM->value, 'admin'],
                UserRole::BIBLIOTECARIA->value, 'bibliotecario' => [UserRole::BIBLIOTECARIA->value, 'bibliotecario'],
                default => [$roleSlug],
            };

            $query->where(function ($q) use ($slugsBusca) {
                $q->whereHas('roleModel', fn ($r) => $r->whereIn('slug', $slugsBusca))
                    ->orWhereIn('role', $slugsBusca);
            });
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'pendente') {
                $query->where('status_confirmacao', 'pendente');
            } elseif ($status === 'confirmado') {
                $query->where(function ($q) {
                    $q->where('status_confirmacao', 'confirmado')
                        ->orWhereNull('status_confirmacao');
                });
            } elseif ($status === 'inativo') {
                $query->where(function ($q) {
                    $q->where('status_confirmacao', 'inativo')
                        ->orWhere('ativo', false);
                });
            } else {
                $query->where('status_confirmacao', $status);
            }
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

        // Normaliza o papel selecionado para o Enum oficial UserRole e sincroniza o role_id correspondente
        $papelResolvido = $this->resolverPapelUsuario(
            isset($dados['role']) ? (string) $dados['role'] : null,
            isset($dados['role_id']) ? (int) $dados['role_id'] : null
        );
        $dados['role'] = $papelResolvido['role'];
        $dados['role_id'] = $papelResolvido['role_id'];

        // Caso um administrador seja cadastrado sem preencher o campo de e-mail, utiliza o nome/identificador informado
        if (empty($dados['email'])) {
            $dados['email'] = mb_strtolower(trim((string) $dados['name']));
        }

        $turmaId = $dados['turma_id'] ?? null;
        unset($dados['turma_id']);

        $statusConfirmacao = $dados['status_confirmacao'] ?? 'confirmado';
        $dados['status_confirmacao'] = $statusConfirmacao;
        $dados['ativo'] = $dados['ativo'] ?? true;
        $dados['autorizado_por_id'] = $request->user()->id;

        if ($statusConfirmacao === 'confirmado') {
            $dados['confirmado_em'] = now();
        }

        $usuario = User::create($dados);

        $rawRole = $usuario->getAttribute('role');
        $roleTexto = $rawRole instanceof UserRole ? $rawRole->value : (string) $rawRole;
        $executor = $request->user();
        $executorUser = $executor instanceof User ? $executor : null;

        // Registra a criação administrativa do usuário em sua trilha de ações
        $usuario->registrarAcao(
            'usuario_criado',
            "Cadastrou o usuário {$usuario->name} com perfil {$roleTexto}",
            $executorUser
        );

        // Se for aluno e possuir turma informada, matricula o aluno e vincula
        if ($usuario->isAluno() && ! empty($turmaId)) {
            $turma = Turma::find((int) $turmaId);
            if ($turma) {
                $matricula = Matricula::create([
                    'usuario_id' => $usuario->id,
                    'turma_id' => $turma->id_turma,
                    'data_matricula' => now()->toDateString(),
                    'status_matricula' => 'Ativo',
                ]);

                $usuario->registrarVinculoEscolar(
                    $request->user()->id,
                    "Cadastrado diretamente pelo Administrador e vinculado à turma {$turma->nome_identificador}."
                );

                // Propaga o registro de matrícula para a turma e para a matrícula recém-criada
                app(RegistroAcaoService::class)->registrarPropagado(
                    [$turma, $matricula],
                    'matricula_realizada',
                    "Matriculou o(a) estudante {$usuario->name} na turma {$turma->nome_identificador}",
                    $executorUser
                );
            }
        } elseif ($statusConfirmacao === 'confirmado') {
            $usuario->registrarVinculoEscolar(
                $request->user()->id,
                'Cadastrado diretamente pelo Administrador no Controle de Usuários.'
            );
        }

        // Sincroniza data de nascimento com a agenda pessoal se fornecida
        if (! empty($dados['data_nascimento'])) {
            $usuario->syncEventoAniversario($dados['data_nascimento']);
        }

        $usuario->load(['roleModel.permissions', 'autorizadoPor', 'vinculos.autorizadoPor', 'registrosAcoes']);

        return response()->json(new UsuarioResource($usuario), 201);
    }

    /**
     * Exibe os detalhes cadastrais, papel e permissões ativas de um usuário.
     */
    public function show(User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_usuarios');

        $usuario->load(['roleModel.permissions', 'directPermissions', 'registrosAcoes']);

        return response()->json(new UsuarioResource($usuario), 200);
    }

    /**
     * Atualiza dados cadastrais, Role, comentário administrativo e emite notificação direta (Item 1.3.8).
     */
    public function update(UpdateUsuarioRequest $request, User $usuario): JsonResponse
    {
        $dados = $request->validated();
        $isAdm = $request->user()->hasPermissionTo('gerenciar_usuarios') || $request->user()->isAdm();

        // Se turma_id foi informada
        $turmaId = $dados['turma_id'] ?? null;
        $turmaFornecida = array_key_exists('turma_id', $dados);
        unset($dados['turma_id']);

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
            unset($dados['role_id'], $dados['role'], $dados['ativo'], $dados['email'], $dados['comentario_admin'], $dados['status_confirmacao']);
        } else {
            // Garante sincronia entre a coluna enum 'role' e a FK 'role_id' na edição administrativa
            if (! empty($dados['role_id']) || ! empty($dados['role'])) {
                $papelResolvido = $this->resolverPapelUsuario(
                    isset($dados['role']) ? (string) $dados['role'] : null,
                    isset($dados['role_id']) ? (int) $dados['role_id'] : null
                );
                $dados['role'] = $papelResolvido['role'];
                $dados['role_id'] = $papelResolvido['role_id'];
            }

            if (! empty($dados['status_confirmacao']) && $dados['status_confirmacao'] === 'confirmado' && empty($usuario->confirmado_em)) {
                $dados['confirmado_em'] = now();
                $dados['autorizado_por_id'] = $request->user()->id;
            }

            // Se o e-mail foi enviado vazio para um administrador na edição, preserva o identificador existente ou usa o nome
            if (array_key_exists('email', $dados) && empty($dados['email'])) {
                $dados['email'] = $usuario->email ?: mb_strtolower(trim((string) ($dados['name'] ?? $usuario->name)));
            }
        }

        $usuario->update($dados);

        // Se for aluno (ou papel alterado para aluno) e turma_id foi informada no payload
        if ($isAdm && $turmaFornecida && ($usuario->isAluno() || ($dados['role'] ?? null) === UserRole::ALUNO->value)) {
            if (! empty($turmaId)) {
                $turma = Turma::find($turmaId);
                if ($turma) {
                    // Desativa matrículas ativas em outras turmas
                    $usuario->matriculas()
                        ->where('status_matricula', 'Ativo')
                        ->where('turma_id', '!=', $turma->id_turma)
                        ->update(['status_matricula' => 'Inativo']);

                    // Ativa ou cria a matrícula na turma escolhida
                    $matriculaExistente = Matricula::where('usuario_id', $usuario->id)
                        ->where('turma_id', $turma->id_turma)
                        ->first();

                    if ($matriculaExistente) {
                        $matriculaExistente->update(['status_matricula' => 'Ativo']);
                    } else {
                        Matricula::create([
                            'usuario_id' => $usuario->id,
                            'turma_id' => $turma->id_turma,
                            'data_matricula' => now()->toDateString(),
                            'status_matricula' => 'Ativo',
                        ]);
                    }
                }
            } else {
                // Se enviou turma_id nulo/vazio, desativa qualquer matrícula ativa
                $usuario->matriculas()
                    ->where('status_matricula', 'Ativo')
                    ->update(['status_matricula' => 'Inativo']);
            }
        }

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

        if ($isAdm) {
            $executor = $request->user();
            // Registra atualização administrativa cadastral ou de vínculo na trilha do usuário
            $usuario->registrarAcao(
                'usuario_atualizado',
                "Atualizou o cadastro/acesso do usuário {$usuario->name}",
                $executor instanceof User ? $executor : null
            );
        }

        $usuario->load(['roleModel.permissions', 'autorizadoPor', 'vinculos.autorizadoPor', 'turmas', 'registrosAcoes']);

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

        $executor = $request->user();
        $usuario->registrarAcao(
            'usuario_bloqueio_alterado',
            ($novoStatus ? 'Desbloqueou' : 'Bloqueou')." o acesso de {$usuario->name}",
            $executor instanceof User ? $executor : null
        );
        $usuario->load('registrosAcoes');

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
        $papelResolvido = $this->resolverPapelUsuario((string) $validated['role']);
        $roleValue = $papelResolvido['role'];

        $usuario->update([
            'role_id' => $papelResolvido['role_id'],
            'role' => $roleValue,
        ]);

        $executor = $request->user();
        $usuario->registrarAcao(
            'papel_alterado',
            "Alterou o papel institucional de {$usuario->name} para {$roleValue}",
            $executor instanceof User ? $executor : null
        );

        $usuario->load(['roleModel.permissions', 'registrosAcoes']);

        return response()->json([
            'message' => "Papel do usuário alterado com sucesso para {$roleValue}.",
            'usuario' => new UsuarioResource($usuario),
        ], 200);
    }

    /**
     * Inativa o usuário ou exclui-o totalmente do banco de dados (quando permanente=true).
     * Suporta confirmação de nome em duas etapas (estilo GitHub).
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

        $nomeUsuario = $usuario->name;

        // Se o flag permanente foi enviado como true, executa a exclusão física definitiva no banco de dados
        if ($request->boolean('permanente')) {
            DB::transaction(function () use ($usuario) {
                // 1. Revoga todos os tokens ativos
                $usuario->tokens()->delete();

                // 2. Remove alocações em horários de aulas (evita restrictOnDelete)
                DB::table('horario_aulas')->where('professor_id', $usuario->id)->delete();

                // 3. Libera referências docentes em turma_disciplinas
                TurmaDisciplina::where('professor_id', $usuario->id)->update(['professor_id' => null]);

                // 4. Limpa notificações vinculadas
                DB::table('notifications')
                    ->where('notifiable_type', User::class)
                    ->where('notifiable_id', $usuario->id)
                    ->delete();

                // 5. Se o usuário tiver avatar salvo localmente, exclui o arquivo físico
                if (! empty($usuario->avatar) && ! str_starts_with($usuario->avatar, 'http') && Storage::disk('public')->exists($usuario->avatar)) {
                    Storage::disk('public')->delete($usuario->avatar);
                }

                // 6. Exclui definitivamente o usuário (cascata nas tabelas com FK on delete cascade)
                $usuario->delete();
            });

            return response()->json([
                'message' => "Usuário \"{$nomeUsuario}\" foi excluído definitivamente do banco de dados com sucesso.",
                'excluido_permanente' => true,
            ], 200);
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

        $executor = $request->user();
        $usuario->registrarAcao(
            'vinculo_encerrado',
            "Desabilitou o acesso e encerrou o vínculo vigente de {$nomeUsuario}",
            $executor instanceof User ? $executor : null
        );

        return response()->json([
            'message' => "Vínculo do usuário {$nomeUsuario} encerrado com sucesso. O histórico acadêmico foi preservado.",
            'excluido_permanente' => false,
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

        $turma = Turma::findOrFail((int) $request->validated('turma_id'));

        // Inativa eventuais matrículas anteriores e ativa a matrícula na turma escolhida
        Matricula::where('usuario_id', $usuario->id)
            ->where('turma_id', '!=', $turma->id_turma)
            ->where('status_matricula', 'Ativo')
            ->update(['status_matricula' => 'Transferido']);

        $matricula = Matricula::updateOrCreate(
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

        $executor = $request->user();
        // Propaga a aprovação e matrícula para aluno, registro de matrícula e turma
        app(RegistroAcaoService::class)->registrarPropagado(
            [$usuario, $matricula, $turma],
            'aluno_aprovado',
            "Aprovou o acesso do(a) estudante {$usuario->name} e matriculou na turma {$turma->nome_identificador}",
            $executor instanceof User ? $executor : null
        );

        $usuario->load(['turmas', 'autorizadoPor', 'vinculos.autorizadoPor', 'registrosAcoes']);

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
    public function atribuirPermissoes(AtribuirPermissoesUsuarioRequest $request, User $usuario): JsonResponse
    {
        Gate::authorize('gerenciar_papeis_permissoes');

        // Extrai o array de permissões validado pela Form Request
        $validated = $request->validated();

        foreach ($validated['permissoes'] as $item) {
            $permission = Permission::where('slug', $item['permission'])->first();
            if ($permission) {
                $usuario->directPermissions()->syncWithoutDetaching([
                    $permission->id => ['concedida' => $item['concedida']],
                ]);
            }
        }

        $executor = $request->user();
        $usuario->registrarAcao(
            'permissoes_atualizadas',
            "Atualizou permissões diretas do usuário {$usuario->name}",
            $executor instanceof User ? $executor : null
        );

        $usuario->load(['roleModel.permissions', 'directPermissions', 'registrosAcoes']);

        return response()->json([
            'message' => 'Permissões do usuário atualizadas com sucesso.',
            'usuario' => new UsuarioResource($usuario),
        ], 200);
    }

    /**
     * Normaliza o papel institucional para um valor válido do Enum UserRole
     * e localiza o registro relacional na tabela roles (compatibilizando 'adm' e 'admin').
     *
     * @return array{role: string, role_id: int|null}
     */
    private function resolverPapelUsuario(?string $roleSlug = null, ?int $roleId = null): array
    {
        $roleModel = ! empty($roleId) ? Role::find($roleId) : null;

        // Prioriza o slug enviado no formulário; se ausente, extrai do Role relacional
        $slugBruto = ! empty($roleSlug)
            ? mb_strtolower(trim($roleSlug))
            : ($roleModel ? mb_strtolower(trim((string) $roleModel->slug)) : '');

        // Converte aliases legados para o valor oficial do Enum UserRole
        $roleEnum = UserRole::tryFrom($slugBruto);
        $slugNormalizado = match ($slugBruto) {
            'admin', 'administrador' => UserRole::ADM->value,
            'bibliotecario' => UserRole::BIBLIOTECARIA->value,
            'padrao', '' => UserRole::ALUNO->value,
            default => $roleEnum instanceof UserRole ? $roleEnum->value : UserRole::ALUNO->value,
        };

        $slugsBusca = $slugNormalizado === UserRole::ADM->value
            ? [UserRole::ADM->value, 'admin']
            : [$slugNormalizado];

        // Garante que o Role relacional encontrado corresponde exatamente ao papel normalizado
        if (! $roleModel || ! in_array(mb_strtolower(trim((string) $roleModel->slug)), $slugsBusca, true)) {
            $roleModel = Role::whereIn('slug', $slugsBusca)->first();
        }

        return [
            'role' => $slugNormalizado,
            'role_id' => $roleModel?->id,
        ];
    }
}
