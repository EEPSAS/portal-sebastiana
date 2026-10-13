<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLivroRequest;
use App\Http\Requests\UpdateLivroRequest;
use App\Http\Resources\LivroResource;
use App\Models\Livro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo catálogo e gestão de livros físicos da biblioteca escolar.
 */
class LivroController extends Controller
{
    /**
     * Lista os livros do acervo com suporte a filtros dinâmicos de busca.
     *
     * @param  Request  $request  Requisição HTTP com parâmetros de busca
     * @return JsonResponse Coleção de livros formatada pelo LivroResource
     */
    public function index(Request $request): JsonResponse
    {
        // Constrói a query base do Eloquent
        $query = Livro::query();

        // Filtra por termo de busca no título ou descrição
        if ($request->filled('q')) {
            $query->buscar($request->string('q')->toString());
        }

        // Filtra por gênero literário específico
        if ($request->filled('genero')) {
            $query->where('genero', $request->string('genero')->toString());
        }

        // Filtra por autor do exemplar
        if ($request->filled('autor')) {
            $query->where('autor', 'like', '%'.$request->string('autor')->toString().'%');
        }

        // Exibe somente livros com cópias disponíveis para empréstimo
        if ($request->boolean('apenas_disponiveis')) {
            $query->disponiveis();
        }

        // Executa a busca ordenada e encapsula no Resource para padronizar o payload
        $livros = $query->orderBy('titulo')->get();

        return response()->json(LivroResource::collection($livros), 200);
    }

    /**
     * Cadastra um novo livro físico no acervo da biblioteca escolar.
     *
     * @param  StoreLivroRequest  $request  Form Request com dados validados
     * @return JsonResponse Livro criado encapsulado no Resource
     */
    public function store(StoreLivroRequest $request): JsonResponse
    {
        // Autoriza a criação via Policy
        Gate::authorize('create', Livro::class);

        $data = $request->validated();

        // Se a quantidade disponível inicial não for definida, assume a quantidade total
        if (! isset($data['quantidade_disponivel'])) {
            $data['quantidade_disponivel'] = $data['quantidade_total'];
        }

        // Persiste o livro no banco de dados
        $livro = Livro::create($data);

        return response()->json(new LivroResource($livro), 201);
    }

    /**
     * Exibe os detalhes e disponibilidade de um livro específico.
     *
     * @param  Livro  $livro  Model resolvido automaticamente pelo Route Model Binding
     * @return JsonResponse Dados do livro formatados
     */
    public function show(Livro $livro): JsonResponse
    {
        Gate::authorize('view', $livro);

        return response()->json(new LivroResource($livro), 200);
    }

    /**
     * Atualiza as informações cadastrais de um livro do acervo.
     *
     * @param  UpdateLivroRequest  $request  Form Request validada
     * @param  Livro  $livro  Instância do livro a ser atualizado
     * @return JsonResponse Livro atualizado formatado
     */
    public function update(UpdateLivroRequest $request, Livro $livro): JsonResponse
    {
        Gate::authorize('update', $livro);

        // Atualiza apenas os campos permitidos e validados pela Form Request
        $livro->update($request->validated());

        return response()->json(new LivroResource($livro), 200);
    }

    /**
     * Remove um exemplar do acervo escolar.
     *
     * @return JsonResponse Retorno HTTP 204 sem conteúdo
     */
    public function destroy(Livro $livro): JsonResponse
    {
        Gate::authorize('delete', $livro);

        $livro->delete();

        return response()->json(null, 204);
    }

    /**
     * Consulta e retorna a disponibilidade de retirada de um livro.
     *
     * @return JsonResponse Indicador booleano e quantidades
     */
    public function verificarDisponibilidade(Livro $livro): JsonResponse
    {
        return response()->json([
            'id_livro' => $livro->id_livro ?? $livro->id,
            'titulo' => $livro->titulo,
            'disponivel' => $livro->verificarDisponibilidade(),
            'quantidade_disponivel' => (int) $livro->quantidade_disponivel,
            'quantidade_total' => (int) $livro->quantidade_total,
        ], 200);
    }
}
