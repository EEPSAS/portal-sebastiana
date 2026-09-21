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
    /**
     * Display a listing of events with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Evento::query()->with('criador:id,name');

        if ($request->filled('mes') && $request->filled('ano')) {
            $query->porMesAno($request->integer('mes'), $request->integer('ano'));
        } elseif ($request->filled('data_inicio')) {
            $query->porPeriodo(
                $request->string('data_inicio')->toString(),
                $request->has('data_fim') ? $request->string('data_fim')->toString() : null
            );
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->string('tipo')->toString());
        }

        if ($request->has('importante')) {
            $query->where('importante', $request->boolean('importante'));
        }

        $eventos = $query->orderBy('data_inicio')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json($eventos, 200);
    }

    /**
     * Display only the important calendar dates.
     */
    public function datasImportantes(Request $request): JsonResponse
    {
        $query = Evento::query()
            ->importantes()
            ->with('criador:id,name');

        if ($request->filled('ano')) {
            $query->whereYear('data_inicio', $request->integer('ano'));
        }

        $datasImportantes = $query->orderBy('data_inicio')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json($datasImportantes, 200);
    }

    /**
     * Store a newly created event in storage.
     */
    public function store(StoreEventoRequest $request): JsonResponse
    {
        Gate::authorize('create', Evento::class);

        $data = $request->validated();
        $data['criador_id'] = $request->user()->id;

        $evento = Evento::create($data);
        $evento->load('criador:id,name');

        return response()->json($evento, 201);
    }

    /**
     * Display the specified event.
     */
    public function show(Evento $evento): JsonResponse
    {
        Gate::authorize('view', $evento);

        $evento->load('criador:id,name');

        return response()->json($evento, 200);
    }

    /**
     * Update the specified event in storage.
     */
    public function update(UpdateEventoRequest $request, Evento $evento): JsonResponse
    {
        Gate::authorize('update', $evento);

        $evento->update($request->validated());
        $evento->load('criador:id,name');

        return response()->json($evento, 200);
    }

    /**
     * Remove the specified event from storage.
     */
    public function destroy(Request $request, Evento $evento): JsonResponse
    {
        Gate::authorize('delete', $evento);

        $evento->delete();

        return response()->json(null, 204);
    }
}
