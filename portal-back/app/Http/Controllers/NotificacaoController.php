<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotificacaoRequest;
use App\Http\Resources\NotificacaoResource;
use App\Services\NotificacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacaoController extends Controller
{
    public function __construct(private readonly NotificacaoService $notificacaoService) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 30), 1), 100);
        $notificacoes = $request->user()
            ->unreadNotifications()
            ->latest()
            ->paginate($perPage);

        return NotificacaoResource::collection($notificacoes)->response();
    }

    public function superImportantes(Request $request): JsonResponse
    {
        $notificacoes = $request->user()
            ->unreadNotifications()
            ->where('data->prioridade', 'super_importante')
            ->latest()
            ->get();

        return NotificacaoResource::collection($notificacoes)->response();
    }

    public function store(StoreNotificacaoRequest $request): JsonResponse
    {
        $notificacoes = $this->notificacaoService->criarManual(
            $request->user(),
            $request->validated()
        );

        return NotificacaoResource::collection($notificacoes)
            ->response()
            ->setStatusCode(201);
    }

    public function marcarLida(Request $request, string $notificacao): NotificacaoResource
    {
        $registro = $request->user()
            ->notifications()
            ->whereKey($notificacao)
            ->firstOrFail();

        $registro->markAsRead();

        return new NotificacaoResource($registro->fresh());
    }

    public function marcarPadraoLidas(Request $request): JsonResponse
    {
        $request->user()
            ->unreadNotifications()
            ->where('data->prioridade', 'padrao')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(null, 204);
    }
}
