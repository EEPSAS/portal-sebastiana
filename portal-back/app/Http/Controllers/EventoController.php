<?php

namespace App\Http\Controllers;

use App\Enums\TipoEvento;
use App\Http\Requests\StoreEventoRequest;
use App\Http\Requests\UpdateEventoRequest;
use App\Http\Resources\EventoResource;
use App\Models\Evento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo calendário letivo, datas importantes e eventos escolares.
 */
class EventoController extends Controller
{
    /**
     * Lista eventos escolares com suporte a filtros de período, categoria e importância.
     *
     * @return JsonResponse Coleção de eventos formatada pelo EventoResource
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Carrega dados básicos do criador para evitar consultas N+1
        $query = Evento::query()->with('criador:id,name');

        // Filtro de visibilidade: usuário comum visualiza seus próprios eventos e os eventos institucionais
        if ($user && ! $user->canManageEvents()) {
            $userId = $user->id;
            $query->where(function ($q) use ($userId) {
                $q->where('criador_id', $userId)
                    ->orWhereHas('criador', function ($creatorQuery) {
                        $creatorQuery->where('role', 'especialista')
                            ->orWhere('role', 'adm')
                            ->orWhereHas('roleModel', fn ($r) => $r->whereIn('slug', ['especialista', 'admin']));
                    });
            });
        } elseif ($request->filled('usuario_id')) {
            $query->where('criador_id', $request->integer('usuario_id'));
        }

        // Filtro por mês e ano
        if ($request->filled('mes') && $request->filled('ano')) {
            $query->porMesAno($request->integer('mes'), $request->integer('ano'));
        } elseif ($request->filled('data_inicio')) {
            $query->porPeriodo(
                $request->string('data_inicio')->toString(),
                $request->has('data_fim') ? $request->string('data_fim')->toString() : null
            );
        }

        // Filtro por categoria (Enum TipoEvento)
        if ($request->filled('tipo')) {
            $tipoParsed = TipoEvento::tryFromLoose($request->string('tipo')->toString());
            $query->where('tipo', $tipoParsed ? $tipoParsed->value : $request->string('tipo')->toString());
        }

        // Filtro de destaque
        if ($request->has('importante')) {
            $query->where('importante', $request->boolean('importante'));
        }

        // Ordena por data e horário de início
        $eventos = $query->orderBy('data_inicio')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json(EventoResource::collection($eventos), 200);
    }

    /**
     * Lista eventos em destaque marcados como importantes.
     */
    public function datasImportantes(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Evento::query()
            ->importantes()
            ->with('criador:id,name');

        if ($user && ! $user->canManageEvents()) {
            $userId = $user->id;
            $query->where(function ($q) use ($userId) {
                $q->where('criador_id', $userId)
                    ->orWhereHas('criador', function ($creatorQuery) {
                        $creatorQuery->where('role', 'especialista')
                            ->orWhere('role', 'adm')
                            ->orWhereHas('roleModel', fn ($r) => $r->whereIn('slug', ['especialista', 'admin']));
                    });
            });
        }

        $eventos = $query->orderBy('data_inicio')->get();

        return response()->json(EventoResource::collection($eventos), 200);
    }

    /**
     * Persiste um novo evento no calendário letivo.
     */
    public function store(StoreEventoRequest $request): JsonResponse
    {
        Gate::authorize('create', Evento::class);

        $data = $request->validated();
        // Vincula o usuário autenticado como criador do evento
        $data['criador_id'] = $request->user()->id;

        if (empty($data['tipo'])) {
            $data['tipo'] = TipoEvento::EVENTOS;
        }

        // Usuários comuns não podem criar eventos institucionais com destaque
        if (! $request->user()->canManageEvents()) {
            $data['importante'] = false;
        }

        $evento = Evento::create($data);
        $evento->load('criador:id,name');

        return response()->json(new EventoResource($evento), 201);
    }

    /**
     * Exibe os detalhes de um evento específico.
     */
    public function show(Evento $evento): JsonResponse
    {
        Gate::authorize('view', $evento);

        $evento->load('criador:id,name');

        return response()->json(new EventoResource($evento), 200);
    }

    /**
     * Atualiza as informações de um evento.
     */
    public function update(UpdateEventoRequest $request, Evento $evento): JsonResponse
    {
        Gate::authorize('update', $evento);

        $evento->update($request->validated());
        $evento->load('criador:id,name');

        return response()->json(new EventoResource($evento), 200);
    }

    /**
     * Remove um evento do calendário.
     *
     * @return JsonResponse Retorno HTTP 204
     */
    public function destroy(Request $request, Evento $evento): JsonResponse
    {
        Gate::authorize('delete', $evento);

        $evento->delete();

        return response()->json(null, 204);
    }
}
