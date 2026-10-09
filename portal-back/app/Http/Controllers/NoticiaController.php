<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNoticiaRequest;
use App\Http\Requests\UpdateNoticiaRequest;
use App\Http\Resources\NoticiaResource;
use App\Models\Noticia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Controller responsável pela gestão e publicação de notícias e comunicados.
class NoticiaController extends Controller
{
    // Lista todas as noticias cadastradas
    public function index(): JsonResponse
    {
        $noticias = Noticia::query()
            ->with('autor:id,name')
            ->orderByDesc('destaque')
            ->orderByDesc('data_publicacao')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return response()->json(NoticiaResource::collection($noticias), 200);
    }

    // Salva uma nova noticia no banco
    public function store(StoreNoticiaRequest $request): JsonResponse
    {
        $noticia = DB::transaction(function () use ($request): Noticia {
            $data = $request->validated();
            $data['autor_id'] = $request->user()->id;
            $data['descricao'] = $data['descricao'] ?? substr(strip_tags($data['conteudo'] ?? ''), 0, 150);

            if ($data['destaque'] ?? false) {
                Noticia::where('destaque', true)->update(['destaque' => false]);
            }

            return Noticia::create($data);
        });

        $noticia->load('autor:id,name');

        return response()->json(new NoticiaResource($noticia), 201);
    }

    // Exibe os detalhes de uma noticia especifica
    public function show(Noticia $noticia): JsonResponse
    {
        $noticia->load('autor:id,name');

        return response()->json(new NoticiaResource($noticia), 200);
    }

    // Atualiza os dados de uma noticia existente
    public function update(UpdateNoticiaRequest $request, Noticia $noticia): JsonResponse
    {
        DB::transaction(function () use ($request, $noticia): void {
            $data = $request->validated();

            if (($data['destaque'] ?? false) === true) {
                Noticia::where('id', '!=', $noticia->id)
                    ->where('destaque', true)
                    ->update(['destaque' => false]);
            }

            $noticia->update($data);
        });

        $noticia->load('autor:id,name');

        return response()->json(new NoticiaResource($noticia), 200);
    }

    // Remove uma noticia do sistema
    public function destroy(Request $request, Noticia $noticia): JsonResponse
    {
        if (! $request->user()?->hasPermissionTo('gerenciar_noticias')) {
            return response()->json(['message' => 'Não autorizado a remover notícias.'], 403);
        }

        $noticia->delete();

        return response()->json(null, 204);
    }
}
