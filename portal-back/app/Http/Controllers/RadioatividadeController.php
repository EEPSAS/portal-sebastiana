<?php

namespace App\Http\Controllers;

use App\Http\Resources\RadioatividadeResource;
use App\Models\Radioatividade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller responsável pelos episódios da Radioatividade (podcast do Terceirão).
 */
class RadioatividadeController extends Controller
{
    /**
     * Lista todos os episódios do podcast cadastrados.
     *
     * @return JsonResponse Coleção formatada por RadioatividadeResource
     */
    public function index(): JsonResponse
    {
        $episodios = Radioatividade::orderByDesc('data_publicacao')->get();

        return response()->json(RadioatividadeResource::collection($episodios), 200);
    }

    /**
     * Cadastra e persiste um novo episódio da rádio escolar.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:1000'],
            'audio_url' => ['required', 'string', 'url'],
            'data_publicacao' => ['nullable', 'date'],
        ]);

        $validated['criador_id'] = $request->user()?->id;
        $validated['data_publicacao'] = $validated['data_publicacao'] ?? now()->format('Y-m-d');

        $episodio = Radioatividade::create($validated);

        return response()->json(new RadioatividadeResource($episodio), 201);
    }

    /**
     * Exibe os detalhes de um episódio específico.
     */
    public function show(Radioatividade $radioatividade): JsonResponse
    {
        return response()->json(new RadioatividadeResource($radioatividade), 200);
    }

    /**
     * Atualiza os dados de um episódio existente.
     */
    public function update(Request $request, Radioatividade $radioatividade): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:1000'],
            'audio_url' => ['sometimes', 'required', 'string', 'url'],
            'data_publicacao' => ['nullable', 'date'],
        ]);

        $radioatividade->update($validated);

        return response()->json(new RadioatividadeResource($radioatividade), 200);
    }

    /**
     * Remove um episódio do podcast.
     *
     * @return JsonResponse Retorno HTTP 204
     */
    public function destroy(Radioatividade $radioatividade): JsonResponse
    {
        $radioatividade->delete();

        return response()->json(null, 204);
    }
}
