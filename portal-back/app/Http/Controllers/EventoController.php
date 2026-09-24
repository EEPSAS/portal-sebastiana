<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventoRequest;
use App\Http\Requests\UpdateEventoRequest;
use App\Models\Evento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class EventoController extends Controller
{
    // Lista eventos com filtros opcionais
    public function index(Request $request): JsonResponse
    {
        // Carrega dados basicos do criador
        $query = Evento::query()->with('criador:id,name');

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

        // Filtra por categoria
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->string('tipo')->toString());
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

    // Lista apenas eventos destacados
    public function datasImportantes(Request $request): JsonResponse
    {
        // Aplica escopo de eventos importantes
        $query = Evento::query()
            ->importantes()
            ->with('criador:id,name');

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

    // Cria um novo evento
    public function store(StoreEventoRequest $request): JsonResponse
    {
        // Checa permissao de criacao
        Gate::authorize('create', Evento::class);

        // Associa o usuario logado como criador
        $data = $request->validated();
        $data['criador_id'] = $request->user()->id;

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