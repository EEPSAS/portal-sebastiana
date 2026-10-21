<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNoticiaRequest;
use App\Http\Requests\UpdateNoticiaRequest;
use App\Http\Resources\NoticiaResource;
use App\Models\Noticia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * NoticiaController - Gerenciamento de Notícias Escolares
 *
 * Papel Didático:
 * Controlador RESTful responsável pelas operações do Módulo 2 (Notícias).
 * Utiliza Form Requests para blindagem de entrada, Eloquent API Resources
 * para blindagem de saída, e transações de banco para garantir consistência
 * ao definir notícias em destaque e persistir uploads de capas e miniaturas.
 */
class NoticiaController extends Controller
{
    /**
     * Lista as notícias cadastradas no portal.
     * Suporta paginação declarativa quando informados os parâmetros 'page' ou 'per_page'.
     * Retorna array direto de itens quando consultado sem parâmetros (compatibilidade com Home).
     * Rota pública: GET /api/noticias
     */
    public function index(Request $request): JsonResponse
    {
        $query = Noticia::query()
            ->with('autor:id,name,nickname')
            ->orderByDesc('destaque')
            // Usa o nome real da coluna na migration; 'data_publicacao' é apenas alias do Model
            ->orderByDesc('dataPublicacao')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        // Se houver parâmetro de paginação explícito, retorna a estrutura paginada da API
        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->query('per_page', 10);
            $noticiasPaginadas = $query->paginate($perPage);

            return NoticiaResource::collection($noticiasPaginadas)->response();
        }

        // Se explicitamente solicitado ?all=true, retorna todas as notícias
        if ($request->boolean('all')) {
            $noticias = $query->get();

            return response()->json(NoticiaResource::collection($noticias), 200);
        }

        // Caso padrão para a Home pública: Retorna as 5 principais notícias
        $noticias = $query->limit(5)->get();

        return response()->json(NoticiaResource::collection($noticias), 200);
    }

    /**
     * Salva uma nova notícia escolar no banco de dados.
     * Rota protegida: POST /api/noticias (Especialista, Administrador e usuários com permissão)
     */
    public function store(StoreNoticiaRequest $request): JsonResponse
    {
        $noticia = DB::transaction(function () use ($request): Noticia {
            $data = $request->validated();

            // Vincula automaticamente o usuário logado como autor da matéria
            $data['autor_id'] = $request->user()->id;
            $data['categoria'] = ! empty($data['categoria']) ? $data['categoria'] : 'Geral';
            $data['descricao'] = ! empty($data['descricao'])
                ? $data['descricao']
                : substr(strip_tags($data['conteudo'] ?? ''), 0, 160);

            // Processamento do upload da Imagem de Capa (Principal)
            if ($request->hasFile('foto')) {
                $caminhoCapa = $request->file('foto')->store('noticias/capas', 'public');
                $data['imagem'] = $caminhoCapa;
            } elseif (! empty($data['url_foto'])) {
                $data['imagem'] = $data['url_foto'];
            }

            // Processamento do upload da Imagem Miniatura
            if ($request->hasFile('miniatura_arquivo')) {
                $caminhoMiniatura = $request->file('miniatura_arquivo')->store('noticias/miniaturas', 'public');
                $data['miniatura'] = $caminhoMiniatura;
            } elseif (! empty($data['url_miniatura'])) {
                $data['miniatura'] = $data['url_miniatura'];
            } elseif (! empty($data['imagem'])) {
                // Fallback pedagógico: Se a miniatura não for enviada, herda a própria capa
                $data['miniatura'] = $data['imagem'];
            }

            // Limpa chaves auxiliares de arquivos do payload antes do create
            unset($data['foto'], $data['miniatura_arquivo'], $data['url_foto'], $data['url_miniatura']);

            // Regra pedagógica: Se a nova notícia é destaque, desmarca o destaque anterior
            if (! empty($data['destaque'])) {
                Noticia::where('destaque', true)->update(['destaque' => false]);
            }

            return Noticia::create($data);
        });

        // Eager loading do autor para compor o payload do Resource
        $noticia->load('autor:id,name,nickname');

        return response()->json(new NoticiaResource($noticia), 201);
    }

    /**
     * Exibe os detalhes de uma notícia específica.
     * Rota pública: GET /api/noticias/{noticia}
     */
    public function show(Noticia $noticia): JsonResponse
    {
        $noticia->load('autor:id,name,nickname');

        return response()->json(new NoticiaResource($noticia), 200);
    }

    /**
     * Atualiza os dados de uma notícia existente.
     * Rota protegida: PUT /api/noticias/{noticia}
     */
    public function update(UpdateNoticiaRequest $request, Noticia $noticia): JsonResponse
    {
        DB::transaction(function () use ($request, $noticia): void {
            $data = $request->validated();

            // Processamento do upload da nova Capa (se enviada)
            if ($request->hasFile('foto')) {
                // Remove imagem física anterior se armazenada localmente
                if (! empty($noticia->getRawOriginal('imagem')) && ! str_starts_with($noticia->getRawOriginal('imagem'), 'http') && Storage::disk('public')->exists($noticia->getRawOriginal('imagem'))) {
                    Storage::disk('public')->delete($noticia->getRawOriginal('imagem'));
                }
                $data['imagem'] = $request->file('foto')->store('noticias/capas', 'public');
            } elseif (array_key_exists('url_foto', $data)) {
                $data['imagem'] = $data['url_foto'];
            }

            // Processamento do upload da nova Miniatura (se enviada)
            if ($request->hasFile('miniatura_arquivo')) {
                if (! empty($noticia->getRawOriginal('miniatura')) && ! str_starts_with($noticia->getRawOriginal('miniatura'), 'http') && Storage::disk('public')->exists($noticia->getRawOriginal('miniatura'))) {
                    Storage::disk('public')->delete($noticia->getRawOriginal('miniatura'));
                }
                $data['miniatura'] = $request->file('miniatura_arquivo')->store('noticias/miniaturas', 'public');
            } elseif (array_key_exists('url_miniatura', $data)) {
                $data['miniatura'] = $data['url_miniatura'];
            }

            // Limpa chaves auxiliares de arquivos do payload antes do update
            unset($data['foto'], $data['miniatura_arquivo'], $data['url_foto'], $data['url_miniatura']);

            // Se alterou para destaque, desmarca destaque das demais notícias
            if (isset($data['destaque']) && (bool) $data['destaque'] === true) {
                Noticia::where('id', '!=', $noticia->id)
                    ->where('destaque', true)
                    ->update(['destaque' => false]);
            }

            $noticia->update($data);
        });

        $noticia->load('autor:id,name,nickname');

        return response()->json(new NoticiaResource($noticia), 200);
    }

    /**
     * Remove uma notícia do portal escolar.
     * Rota protegida: DELETE /api/noticias/{noticia} (Especialista e Administrador)
     */
    public function destroy(Request $request, Noticia $noticia): JsonResponse
    {
        $user = $request->user();

        // Checagem semântica: Apenas Administrador e Especialista podem excluir notícias
        if (! $user || (! $user->isAdm() && ! $user->isEspecialista() && ! $user->hasPermissionTo('gerenciar_noticias'))) {
            return response()->json(['message' => 'Não autorizado a remover notícias escolares.'], 403);
        }

        $noticia->delete();

        return response()->json([
            'message' => 'Notícia removida com sucesso.',
        ], 200);
    }
}
