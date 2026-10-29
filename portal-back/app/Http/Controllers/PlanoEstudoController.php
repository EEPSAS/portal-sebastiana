<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompartilharPlanoEstudoRequest;
use App\Http\Requests\StorePlanoEstudoItemRequest;
use App\Http\Requests\StorePlanoEstudoRequest;
use App\Http\Resources\PlanoEstudoItemResource;
use App\Http\Resources\PlanoEstudoResource;
use App\Http\Resources\TurmaResource;
use App\Models\Disciplina;
use App\Models\Livro;
use App\Models\PlanoEstudo;
use App\Models\PlanoEstudoItem;
use App\Models\Turma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Controller responsável pelo gerenciamento de Planos de Estudos, seus itens e compartilhamento por turma.
 *
 * Papel Didático:
 * Centraliza as ações RESTful de trilhas de estudo:
 * - Listagem agregada com contadores reais de livros, videoaulas e conteúdos web;
 * - Isolamento de visibilidade: alunos veem apenas seus planos e os planos compartilhados com sua turma;
 * - Compartilhamento exclusivo por professores para turmas do 1º, 2º ou 3º ano;
 * - Adição e remoção de conteúdos preservando as fontes originais da Biblioteca.
 */
class PlanoEstudoController extends Controller
{
    /**
     * Lista os planos de estudos visíveis ao usuário autenticado com contadores reais por tipo.
     * Alunos visualizam seus próprios planos e os planos compartilhados com sua turma ativa.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $usuario = $request->user();

        $query = PlanoEstudo::query()
            ->with(['user:id,name', 'turmas'])
            ->withCount([
                'itens as livros_count' => fn ($q) => $q->where('tipo', 'livro'),
                'itens as videoaulas_count' => fn ($q) => $q->where('tipo', 'videoaula'),
                'itens as conteudos_web_count' => fn ($q) => $q->where('tipo', 'conteudo_web'),
            ]);

        if ($usuario->isAluno()) {
            // Identifica as turmas ativas em que o estudante está matriculado
            $turmaIds = $usuario->turmas()
                ->wherePivot('status_matricula', 'Ativo')
                ->pluck('turmas.id_turma')
                ->all();

            // O aluno enxerga seus próprios planos OU planos compartilhados por professores com sua turma
            $query->where(function ($subQuery) use ($usuario, $turmaIds) {
                $subQuery->where('user_id', $usuario->id);

                if (! empty($turmaIds)) {
                    $subQuery->orWhereHas('turmas', function ($turmaQuery) use ($turmaIds) {
                        $turmaQuery->whereIn('turmas.id_turma', $turmaIds);
                    });
                }
            });
        } else {
            // Professores e demais perfis visualizam na listagem principal os planos criados por eles
            $query->where('user_id', $usuario->id);
        }

        $planos = $query->latest()->get();

        return PlanoEstudoResource::collection($planos);
    }

    /**
     * Cria um novo plano de estudos para o usuário logado.
     */
    public function store(StorePlanoEstudoRequest $request): JsonResponse
    {
        $dados = $request->validated();
        $dados['user_id'] = $request->user()->id;

        // Se o id da disciplina foi informado e a string não, preenche com o nome oficial da disciplina
        if (! empty($dados['disciplina_id']) && empty($dados['disciplina'])) {
            $disciplinaModel = Disciplina::find($dados['disciplina_id']);
            if ($disciplinaModel) {
                $dados['disciplina'] = $disciplinaModel->nome;
            }
        }

        $plano = PlanoEstudo::create($dados);
        $plano->load(['user:id,name', 'turmas']);

        return (new PlanoEstudoResource($plano))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Exibe os detalhes completos de um plano de estudos com todos os seus itens associados.
     */
    public function show(Request $request, PlanoEstudo $plano): PlanoEstudoResource|JsonResponse
    {
        $usuario = $request->user();
        $ehProprietarioOuAdm = $plano->user_id === $usuario->id || $usuario->isAdm();

        // Verifica se o aluno tem acesso via compartilhamento do professor com a sua turma ativa
        $compartilhadoComAluno = false;
        if (! $ehProprietarioOuAdm && $usuario->isAluno()) {
            $turmaIds = $usuario->turmas()
                ->wherePivot('status_matricula', 'Ativo')
                ->pluck('turmas.id_turma')
                ->all();

            if (! empty($turmaIds)) {
                $compartilhadoComAluno = $plano->turmas()
                    ->whereIn('turmas.id_turma', $turmaIds)
                    ->exists();
            }
        }

        if (! $ehProprietarioOuAdm && ! $compartilhadoComAluno) {
            return response()->json([
                'message' => 'Você não possui autorização para acessar este plano de estudos.',
            ], 403);
        }

        // Carrega o criador, turmas vinculadas e itens ordenados do mais recente para o mais antigo
        $plano->load([
            'user:id,name',
            'turmas',
            'itens' => fn ($q) => $q->latest(),
        ]);

        return new PlanoEstudoResource($plano);
    }

    /**
     * Compartilha (sincroniza) um plano de estudos do professor com turmas selecionadas (1º, 2º ou 3º ano).
     */
    public function compartilhar(CompartilharPlanoEstudoRequest $request, PlanoEstudo $plano): PlanoEstudoResource
    {
        $turmaIds = $request->validated('turma_ids') ?? [];

        // Sincroniza os vínculos na tabela pivot plano_estudo_turmas
        $plano->turmas()->sync($turmaIds);

        $plano->load(['user:id,name', 'turmas']);
        $plano->loadCount([
            'itens as livros_count' => fn ($q) => $q->where('tipo', 'livro'),
            'itens as videoaulas_count' => fn ($q) => $q->where('tipo', 'videoaula'),
            'itens as conteudos_web_count' => fn ($q) => $q->where('tipo', 'conteudo_web'),
        ]);

        return new PlanoEstudoResource($plano);
    }

    /**
     * Lista as turmas às quais o professor autenticado está vinculado (com suporte a busca textual).
     */
    public function turmasLecionadas(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $usuario = $request->user();

        if (! $usuario->isProfessor() && ! $usuario->isAdm()) {
            return response()->json([
                'message' => 'Apenas professores podem consultar turmas para compartilhamento de planos.',
            ], 403);
        }

        $query = Turma::query()
            ->withCount(['alunos', 'disciplinas'])
            ->where('status', 'Ativa');

        // Filtra estritamente pelas turmas vinculadas ao professor
        if ($usuario->isProfessor() && ! $usuario->isAdm()) {
            foreach ($usuario->disciplinasDocente as $discDocente) {
                $discDocente->sincronizarComTurmasDosCiclos();
            }

            $query->whereHas('turmaDisciplinas', function ($q) use ($usuario, $request) {
                $q->where('professor_id', $usuario->id);
                if ($request->filled('disciplina_id')) {
                    $q->where('disciplina_id', $request->integer('disciplina_id'));
                }
            });
        } elseif ($request->filled('disciplina_id')) {
            $query->whereHas('turmaDisciplinas', function ($q) use ($request) {
                $q->where('disciplina_id', $request->integer('disciplina_id'));
            });
        }

        // Filtro opcional de busca por nome/série da turma (ex: 1º, 2º, 3º ano)
        if ($request->filled('q')) {
            $termo = trim($request->string('q')->toString());
            $query->where('nome_identificador', 'like', "%{$termo}%");
        }

        $turmas = $query->orderBy('nome_identificador')->get();

        return TurmaResource::collection($turmas);
    }

    /**
     * Exclui um plano de estudos do usuário (cascata automática para os itens associados).
     */
    public function destroy(Request $request, PlanoEstudo $plano): JsonResponse
    {
        // Autorização: apenas o criador ou administradores podem excluir o plano
        if ($plano->user_id !== $request->user()->id && ! $request->user()->isAdm()) {
            return response()->json([
                'message' => 'Você não possui autorização para excluir este plano de estudos.',
            ], 403);
        }

        $plano->delete();

        return response()->json([
            'message' => 'Plano de estudos excluído com sucesso.',
        ], 200);
    }

    /**
     * Adiciona um conteúdo didático (livro, videoaula ou conteúdo web) ao plano de estudos.
     */
    public function adicionarItem(StorePlanoEstudoItemRequest $request, PlanoEstudo $plano): JsonResponse
    {
        // Autorização: apenas o criador do plano pode adicionar itens
        if ($plano->user_id !== $request->user()->id && ! $request->user()->isAdm()) {
            return response()->json([
                'message' => 'Você não possui autorização para modificar este plano de estudos.',
            ], 403);
        }

        $dados = $request->validated();

        // Se o item for um livro do acervo e o livro_id não foi informado diretamente, vincula via conteudo_id
        if (($dados['tipo'] ?? null) === 'livro' && empty($dados['livro_id']) && ! empty($dados['conteudo_id']) && is_numeric($dados['conteudo_id'])) {
            $livroEncontrado = Livro::find((int) $dados['conteudo_id']);
            if ($livroEncontrado) {
                $dados['livro_id'] = $livroEncontrado->id_livro;
            }
        }

        $item = $plano->itens()->create($dados);

        return (new PlanoEstudoItemResource($item))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Remove um item específico de um plano de estudos sem afetar o conteúdo original da Biblioteca.
     */
    public function removerItem(Request $request, PlanoEstudo $plano, PlanoEstudoItem $item): JsonResponse
    {
        // Autorização de proprietário
        if ($plano->user_id !== $request->user()->id && ! $request->user()->isAdm()) {
            return response()->json([
                'message' => 'Você não possui autorização para modificar este plano de estudos.',
            ], 403);
        }

        // Valida se o item de fato pertence ao plano indicado na URL
        if ($item->plano_estudo_id !== $plano->id) {
            return response()->json([
                'message' => 'Este item não pertence ao plano de estudos especificado.',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'message' => 'Conteúdo removido do plano de estudos com sucesso.',
        ], 200);
    }
}
