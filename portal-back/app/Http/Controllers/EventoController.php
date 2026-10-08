<?php

namespace App\Http\Controllers;

use App\Enums\TipoEvento;
use App\Http\Requests\StoreEventoRequest;
use App\Http\Requests\UpdateEventoRequest;
use App\Models\Evento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pela gestão e consulta de eventos do calendário escolar.
class EventoController extends Controller
{
    // Lista eventos com filtros opcionais e visibilidade restrita por usuário
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Carrega dados basicos do criador
        $query = Evento::query()->with('criador:id,name');

        // Filtro de visibilidade por ID: usuário padrão vê apenas eventos que ele mesmo cadastrou
        // e eventos cadastrados pelo especialista/administrador escolar
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

        // Filtra por mes/ano
        if ($request->filled('mes') && $request->filled('ano')) {
            $query->porMesAno($request->integer('mes'), $request->integer('ano'));
            // Filtra por intervalo de datas
        } elseif ($request->filled('data_inicio')) {
            $query->porPeriodo(
                $request->string('data_inicio')->toString(),
                $request->has('data_fim') ? $request->string('data_fim')->toString() : null
            );
        }

        // Filtra por categoria / tipo (utilizando o enum TipoEvento)
        if ($request->filled('tipo')) {
            $tipoParsed = TipoEvento::tryFromLoose($request->string('tipo')->toString());
            $query->where('tipo', $tipoParsed ? $tipoParsed->value : $request->string('tipo')->toString());
        }

        // Filtra por destaque
        if ($request->has('importante')) {
            $query->where('importante', $request->boolean('importante'));
        }

        // Ordena por data e hora
        $eventos = $query->orderBy('data_inicio')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json($eventos, 200);
    }

    // Lista apenas eventos destacados respeitando a visibilidade do usuário
    public function datasImportantes(Request $request): JsonResponse
    {
        $user = $request->user();

        // Aplica escopo de eventos importantes
        $query = Evento::query()
            ->importantes()
            ->with('criador:id,name');

        // Filtro de visibilidade para usuário padrão
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

        // Filtra por ano
        if ($request->filled('ano')) {
            $query->whereYear('data_inicio', $request->integer('ano'));
        }

        // Ordena cronologicamente
        $datasImportantes = $query->orderBy('data_inicio')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json($datasImportantes, 200);
    }

    // Cria um novo evento (pessoal para usuário padrão ou institucional para especialista)
    public function store(StoreEventoRequest $request): JsonResponse
    {
        // Checa permissao de criacao
        Gate::authorize('create', Evento::class);

        // Associa o usuario logado como criador
        $data = $request->validated();
        $data['criador_id'] = $request->user()->id;

        // Se tipo não for informado, assume 'Eventos' por padrão
        if (empty($data['tipo'])) {
            $data['tipo'] = TipoEvento::EVENTOS;
        }

        // Usuário padrão cria eventos pessoais (não institucionais destacados)
        if (! $request->user()->canManageEvents()) {
            $data['importante'] = false;
        }

        // Salva e carrega o criador
        $evento = Evento::create($data);
        $evento->load('criador:id,name');

        return response()->json($evento, 201);
    }

    // Exibe um evento especifico
    public function show(Evento $evento): JsonResponse
    {
        // Checa permissao de visualizacao
        Gate::authorize('view', $evento);

        $evento->load('criador:id,name');

        return response()->json($evento, 200);
    }

    // Atualiza um evento
    public function update(UpdateEventoRequest $request, Evento $evento): JsonResponse
    {
        // Checa permissao de edicao
        Gate::authorize('update', $evento);

        // Atualiza e recarrega dados
        $evento->update($request->validated());
        $evento->load('criador:id,name');

        return response()->json($evento, 200);
    }

    // Remove um evento
    public function destroy(Request $request, Evento $evento): JsonResponse
    {
        // Checa permissao de exclusao
        Gate::authorize('delete', $evento);

        $evento->delete();

        // Retorna sucesso sem conteudo
        return response()->json(null, 204);
    }
}
