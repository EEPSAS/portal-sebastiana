<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRemessaDocenteRequest;
use App\Models\RemessaDocente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pelo fluxo de remessas docentes de notas e frequência.
class RemessaDocenteController extends Controller
{
    // Envia uma nova remessa docente com arquivo anexo opcional para turma vinculada.
    public function enviarRemessa(StoreRemessaDocenteRequest $request): JsonResponse
    {
        Gate::authorize('create', RemessaDocente::class);

        $user = $request->user();
        if (! $user->canManageTeachingIn($request->integer('turma_id'), $request->integer('disciplina_id'))) {
            return response()->json([
                'message' => 'Você só pode enviar remessas para turmas e disciplinas às quais está formalmente vinculado.',
            ], 403);
        }

        $caminhoArquivo = null;
        if ($request->hasFile('arquivo_anexo')) {
            $caminhoArquivo = $request->file('arquivo_anexo')->store('remessas', 'public');
        }

        $remessa = RemessaDocente::create([
            'professor_id' => $request->user()->id,
            'turma_id' => $request->integer('turma_id'),
            'disciplina_id' => $request->integer('disciplina_id'),
            'tipo_dado' => $request->string('tipo_dado')->toString(),
            'arquivo_anexo' => $caminhoArquivo,
            'data_envio' => now(),
            'status_processamento' => 'Pendente',
            'observacoes' => $request->filled('observacoes') ? $request->string('observacoes')->toString() : null,
        ]);

        return response()->json($remessa->load(['professor:id,name,email', 'turma', 'disciplina']), 201);
    }

    // Permite ao professor consultar todas as remessas de sua autoria.
    public function consultarRemessaPropria(Request $request): JsonResponse
    {
        $remessas = RemessaDocente::where('professor_id', $request->user()->id)
            ->with(['turma', 'disciplina'])
            ->orderByDesc('data_envio')
            ->get();

        return response()->json($remessas, 200);
    }

    // Lista todas as remessas pendentes de análise para a equipe pedagógica.
    public function listarRemessasPendentes(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', RemessaDocente::class);

        if (! $request->user()->canManageAcademic()) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $remessas = RemessaDocente::where('status_processamento', 'Pendente')
            ->with(['professor:id,name,email', 'turma', 'disciplina'])
            ->orderBy('data_envio')
            ->get();

        return response()->json($remessas, 200);
    }

    // Marca a remessa como anexada/processada no sistema.
    public function marcarComoAnexado(Request $request, RemessaDocente $remessa): JsonResponse
    {
        Gate::authorize('updateStatus', $remessa);

        $remessa->update([
            'status_processamento' => 'Anexado',
        ]);

        return response()->json($remessa->load(['professor:id,name,email', 'turma', 'disciplina']), 200);
    }

    // Rejeita a remessa informando justificativa/observações para o professor.
    public function marcarComoRejeitado(Request $request, RemessaDocente $remessa): JsonResponse
    {
        Gate::authorize('updateStatus', $remessa);

        $validated = $request->validate([
            'observacoes' => ['required', 'string', 'max:1000'],
        ]);

        $remessa->update([
            'status_processamento' => 'Rejeitado',
            'observacoes' => $validated['observacoes'],
        ]);

        return response()->json($remessa->load(['professor:id,name,email', 'turma', 'disciplina']), 200);
    }
}
