<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLivroRequest;
use App\Http\Requests\UpdateLivroRequest;
use App\Models\Livro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LivroController extends Controller
{
    /**
     * Display a listing of books with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Livro::query();

        if ($request->filled('q')) {
            $query->buscar($request->string('q')->toString());
        }

        if ($request->filled('genero')) {
            $query->where('genero', $request->string('genero')->toString());
        }

        if ($request->filled('autor')) {
            $query->where('autor', 'like', '%'.$request->string('autor')->toString().'%');
        }

        if ($request->boolean('apenas_disponiveis')) {
            $query->disponiveis();
        }

        $livros = $query->orderBy('titulo')->get();

        return response()->json($livros, 200);
    }

    /**
     * Store a newly created book in storage.
     */
    public function store(StoreLivroRequest $request): JsonResponse
    {
        Gate::authorize('create', Livro::class);

        $data = $request->validated();
        if (! isset($data['quantidade_disponivel'])) {
            $data['quantidade_disponivel'] = $data['quantidade_total'];
        }

        $livro = Livro::create($data);

        return response()->json($livro, 201);
    }

    /**
     * Display the specified book.
     */
    public function show(Livro $livro): JsonResponse
    {
        Gate::authorize('view', $livro);

        return response()->json($livro, 200);
    }

    /**
     * Update the specified book in storage.
     */
    public function update(UpdateLivroRequest $request, Livro $livro): JsonResponse
    {
        Gate::authorize('update', $livro);

        $livro->update($request->validated());

        return response()->json($livro, 200);
    }

    /**
     * Remove the specified book from storage.
     */
    public function destroy(Livro $livro): JsonResponse
    {
        Gate::authorize('delete', $livro);

        $livro->delete();

        return response()->json(null, 204);
    }

    /**
     * Check availability of the specified book.
     */
    public function verificarDisponibilidade(Livro $livro): JsonResponse
    {
        return response()->json([
            'id_livro' => $livro->id_livro,
            'titulo' => $livro->titulo,
            'disponivel' => $livro->verificarDisponibilidade(),
            'quantidade_disponivel' => $livro->quantidade_disponivel,
            'quantidade_total' => $livro->quantidade_total,
        ], 200);
    }
}
