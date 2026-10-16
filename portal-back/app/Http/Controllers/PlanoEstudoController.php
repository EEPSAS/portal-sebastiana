<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlanoEstudoItemRequest;
use App\Http\Requests\StorePlanoEstudoRequest;
use App\Http\Resources\PlanoEstudoItemResource;
use App\Http\Resources\PlanoEstudoResource;
use App\Models\Livro;
use App\Models\PlanoEstudo;
use App\Models\PlanoEstudoItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Controller responsável pelo gerenciamento de Planos de Estudos e seus itens associados.
 *
 * Papel Didático:
 * Centraliza as ações RESTful de trilhas de estudo:
 * - Listagem agregada com contadores reais de livros, videoaulas e conteúdos web;
 * - Criação e exclusão de planos de estudos pessoais;
 * - Adição e remoção de conteúdos preservando as fontes originais da Biblioteca.
 */
class PlanoEstudoController extends Controller
{
    /**
     * Lista todos os planos de estudos do usuário autenticado com contadores reais por tipo.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $usuario = $request->user();

        // Carrega os planos do usuário com contagem agregada de cada categoria de material
        $planos = $usuario->planosEstudos()
            ->withCount([
                'itens as livros_count' => fn ($q) => $q->where('tipo', 'livro'),
                'itens as videoaulas_count' => fn ($q) => $q->where('tipo', 'videoaula'),
                'itens as conteudos_web_count' => fn ($q) => $q->where('tipo', 'conteudo_web'),
            ])
            ->latest()
            ->get();

        return PlanoEstudoResource::collection($planos);
    }

    /**
     * Cria um novo plano de estudos para o usuário logado.
     */
    public function store(StorePlanoEstudoRequest $request): JsonResponse
    {
        $dados = $request->validated();
        $dados['user_id'] = $request->user()->id;

        $plano = PlanoEstudo::create($dados);

        return (new PlanoEstudoResource($plano))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Exibe os detalhes completos de um plano de estudos com todos os seus itens associados.
     */
    public function show(Request $request, PlanoEstudo $plano): PlanoEstudoResource|JsonResponse
    {
        // Autorização: apenas o criador ou administradores podem visualizar o plano
        if ($plano->user_id !== $request->user()->id && ! $request->user()->isAdm()) {
            return response()->json([
                'message' => 'Você não possui autorização para acessar este plano de estudos.',
            ], 403);
        }

        // Carrega os itens ordenados do mais recente para o mais antigo
        $plano->load(['itens' => fn ($q) => $q->latest()]);

        return new PlanoEstudoResource($plano);
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
