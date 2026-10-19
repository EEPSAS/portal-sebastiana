<?php

namespace App\Http\Controllers;

use App\Enums\TipoEvento;
use App\Enums\UserRole;
use App\Http\Requests\StoreEventoRequest;
use App\Http\Requests\UpdateEventoRequest;
use App\Http\Resources\EventoResource;
use App\Models\Evento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * EventoController - Gestão do Calendário Escolar e Agenda Pessoal (Módulo 4)
 *
 * Papel Didático:
 * Unifica os 2 calendários do portal sob uma única fonte de dados:
 * 1. Visitante no Portal Público: visualiza apenas eventos institucionais (criados por Especialista ou Adm);
 * 2. Usuário autenticado no Dashboard: visualiza os eventos institucionais da escola somados
 *    aos seus próprios eventos pessoais (`criador_id === $user->id`), que são estritamente privados.
 */
class EventoController extends Controller
{
    /**
     * Aplica a regra de visibilidade institucional + pessoal na consulta de eventos.
     */
    private function aplicarFiltroVisibilidade(Builder $query, ?object $user, Request $request): void
    {
        $papeisInstitucionais = [
            UserRole::ESPECIALISTA->value,
            UserRole::ADM->value,
        ];

        // Se não estiver logado (Portal Público) ou se a consulta for explicitamente pública (?publico=1):
        // exibe estritamente eventos institucionais da escola (criados por Especialista ou Adm)
        if (! $user || $request->boolean('publico')) {
            $query->where(function (Builder $q) use ($papeisInstitucionais) {
                $q->whereNull('criador_id')
                    ->orWhereHas('criador', function (Builder $creatorQuery) use ($papeisInstitucionais) {
                        $creatorQuery->whereIn('role', $papeisInstitucionais)
                            ->orWhereHas('roleModel', fn (Builder $r) => $r->whereIn('slug', ['especialista', 'admin', 'adm']));
                    });
            });

            return;
        }

        // Se for Administrador/Especialista filtrando explicitamente por um usuário específico
        if ($user->canManageEvents() && $request->filled('usuario_id')) {
            $query->where('criador_id', $request->integer('usuario_id'));

            return;
        }

        // Usuário logado: vê os eventos institucionais (Especialista/Adm) + apenas os seus próprios eventos pessoais
        $userId = $user->id;
        $query->where(function (Builder $q) use ($userId, $papeisInstitucionais) {
            $q->where('criador_id', $userId)
                ->orWhereNull('criador_id')
                ->orWhereHas('criador', function (Builder $creatorQuery) use ($papeisInstitucionais) {
                    $creatorQuery->whereIn('role', $papeisInstitucionais)
                        ->orWhereHas('roleModel', fn (Builder $r) => $r->whereIn('slug', ['especialista', 'admin', 'adm']));
                });
        });
    }

    /**
     * Lista eventos escolares com suporte a filtros de período, categoria e importância.
     *
     * @return JsonResponse Coleção de eventos formatada pelo EventoResource
     */
    public function index(Request $request): JsonResponse
    {
        // Resolve o usuário autenticado via token Bearer Sanctum mesmo em rota pública
        $user = $request->user('sanctum');

        // Carrega dados básicos do criador para evitar consultas N+1
        $query = Evento::query()->with('criador:id,name');

        // Aplica filtro de visibilidade (público institucional vs privado do autor)
        $this->aplicarFiltroVisibilidade($query, $user, $request);

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
        $user = $request->user('sanctum');

        $query = Evento::query()
            ->importantes()
            ->with('criador:id,name');

        $this->aplicarFiltroVisibilidade($query, $user, $request);

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
        $evento->load('criador');

        // Se for evento de aniversário, sincroniza a nova data com o perfil do usuário
        if ($evento->is_aniversario && $evento->criador && $evento->data_inicio) {
            $dataEvento = $evento->data_inicio->format('Y-m-d');
            $partesEvento = explode('-', $dataEvento);

            if (count($partesEvento) === 3) {
                $usuario = $evento->criador;
                // Preserva o ano de nascimento original se já existia, ajustando mês e dia
                $anoNascimento = $usuario->data_nascimento ? $usuario->data_nascimento->format('Y') : $partesEvento[0];
                $novaDataNascimento = sprintf('%04d-%02d-%02d', (int) $anoNascimento, (int) $partesEvento[1], (int) $partesEvento[2]);
                $usuario->update(['data_nascimento' => $novaDataNascimento]);
            }
        }

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

        // Se o evento excluído for o de aniversário, limpa a data de nascimento no perfil
        if ($evento->is_aniversario && $evento->criador) {
            $evento->criador->update(['data_nascimento' => null]);
        }

        $evento->delete();

        return response()->json(null, 204);
    }
}
