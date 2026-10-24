<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChatDonaNanaRequest;
use App\Http\Requests\UpdateDonaNanaConfigRequest;
use App\Http\Resources\DonaNanaChatResource;
use App\Http\Resources\DonaNanaConfigResource;
use App\Models\DonaNanaConfig;
use App\Services\DonaNanaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller DonaNanaController
 *
 * Papel Didático:
 * Ponto de entrada RESTful para a assistente virtual Dona Nana.
 * - Endpoint `chat`: recebe a mensagem validada pela Form Request e retorna a resposta formatada por API Resource.
 * - Endpoints `getConfig` e `updateConfig`: permitem que Especialistas e Administradores customizem os 4 pilares do prompt.
 */
class DonaNanaController extends Controller
{
    /**
     * Processa a conversa com a Dona Nana (usuário autenticado).
     */
    public function chat(ChatDonaNanaRequest $request, DonaNanaService $service): DonaNanaChatResource
    {
        $dadosValidados = $request->validated();

        $resposta = $service->conversar(
            mensagem: $dadosValidados['mensagem'],
            historico: $dadosValidados['historico'] ?? [],
            contextoOrigem: $dadosValidados['contexto_origem'] ?? null,
            user: $request->user()
        );

        return new DonaNanaChatResource($resposta);
    }

    /**
     * Retorna a configuração atual da persona da Dona Nana.
     * Acessível exclusivamente para Administradores e Especialistas.
     */
    public function getConfig(Request $request): DonaNanaConfigResource
    {
        $user = $request->user();

        if (! $user || (! $user->isAdm() && ! $user->isEspecialista())) {
            abort(403, 'Acesso não autorizado às configurações pedagógicas da Dona Nana.');
        }

        $config = DonaNanaConfig::obterAtiva();

        return new DonaNanaConfigResource($config);
    }

    /**
     * Atualiza os 4 campos da persona da Dona Nana e parâmetros do modelo.
     * Acessível exclusivamente para Administradores e Especialistas.
     */
    public function updateConfig(UpdateDonaNanaConfigRequest $request): JsonResponse
    {
        $config = DonaNanaConfig::obterAtiva();

        $dadosValidados = $request->validated();

        $config->fill($dadosValidados);
        $config->save();

        return (new DonaNanaConfigResource($config))->response()->setStatusCode(200);
    }
}
