<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\DecidirAprovacaoRequest;
use App\Http\Resources\SolicitacaoAprovacaoResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Gerencia a fila de acesso cuja decisão pertence exclusivamente ao Especialista. */
class AprovacaoUsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeEspecialista($request);

        $solicitacoes = User::query()
            ->where('approval_status', 'pending')
            ->whereIn('role', [
                UserRole::ALUNO->value,
                UserRole::PADRAO->value,
                UserRole::PROFESSOR->value,
            ])
            ->orderBy('created_at')
            ->get();

        return response()->json(SolicitacaoAprovacaoResource::collection($solicitacoes));
    }

    public function update(DecidirAprovacaoRequest $request, User $usuario): JsonResponse
    {
        $this->authorizeEspecialista($request);

        abort_unless(
            in_array($usuario->role, [
                UserRole::ALUNO,
                UserRole::PADRAO,
                UserRole::PROFESSOR,
            ], true)
                && $usuario->approval_status === 'pending',
            404,
            'Solicitação pendente não encontrada.'
        );

        $usuario->update($request->validated());

        return response()->json(new SolicitacaoAprovacaoResource($usuario->refresh()));
    }

    private function authorizeEspecialista(Request $request): void
    {
        abort_unless(
            $request->user()?->role === UserRole::ESPECIALISTA,
            403,
            'Somente o Especialista pode analisar solicitações de acesso.'
        );
    }
}
