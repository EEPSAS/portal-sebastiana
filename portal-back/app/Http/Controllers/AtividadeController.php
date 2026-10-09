<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAtividadeRequest;
use App\Http\Requests\UpdateAtividadeRequest;
use App\Models\Atividade;
use App\Models\Disciplina;
use App\Models\Turma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class AtividadeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Atividade::class);

        $query = Atividade::with(['turma:id_turma,nome_identificador', 'disciplina:id_disciplina,nome', 'professor:id,name,email'])
            ->withCount('submissoes')
            ->orderByDesc('data_criacao');

        if ($request->filled('turma_id')) {
            $query->where('turma_id', $request->integer('turma_id'));
        }

        if ($request->filled('disciplina_id')) {
            $query->where('disciplina_id', $request->integer('disciplina_id'));
        }

        if ($request->filled('status')) {
            $query->where('status_atividade', $request->string('status')->toString());
        }

        $atividades = $query->get();

        // Se for aluno autenticado, anexa o status de entrega do próprio aluno
        $user = $request->user();
        if ($user && $user->isPadrao()) {
            $atividades->transform(function ($atividade) use ($user) {
                $minhaSubmissao = $atividade->submissoes()
                    ->where('usuario_id', $user->id)
                    ->first(['id_submissao', 'data_envio', 'nota_atribuida']);

                $atividade->setAttribute('minha_submissao', $minhaSubmissao);

                return $atividade;
            });
        }

        return response()->json($atividades, 200);
    }

    public function store(StoreAtividadeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('arquivo_anexo')) {
            $validated['caminho_arquivo_anexo'] = $request->file('arquivo_anexo')->store('atividades/anexos', 'public');
        }

        $validated['usuario_id'] = $request->user()->id;
        $validated['status_atividade'] = $validated['status_atividade'] ?? 'Aberta';

        $atividade = Atividade::create($validated);

        return response()->json(
            $atividade->load(['turma:id_turma,nome_identificador', 'disciplina:id_disciplina,nome', 'professor:id,name,email']),
            201
        );
    }

    public function show(Request $request, Atividade $atividade): JsonResponse
    {
        Gate::authorize('view', $atividade);

        $atividade->load(['turma', 'disciplina', 'professor:id,name,email'])
            ->loadCount('submissoes');

        $user = $request->user();
        if ($user && $user->isPadrao()) {
            $minhaSubmissao = $atividade->submissoes()
                ->where('usuario_id', $user->id)
                ->first();

            $atividade->setAttribute('minha_submissao', $minhaSubmissao);
        }

        return response()->json($atividade, 200);
    }

    public function update(UpdateAtividadeRequest $request, Atividade $atividade): JsonResponse
    {
        $validated = $request->validated();

        if ($request->boolean('remover_anexo') && $atividade->caminho_arquivo_anexo) {
            Storage::disk('public')->delete($atividade->caminho_arquivo_anexo);
            $validated['caminho_arquivo_anexo'] = null;
        }

        if ($request->hasFile('arquivo_anexo')) {
            if ($atividade->caminho_arquivo_anexo) {
                Storage::disk('public')->delete($atividade->caminho_arquivo_anexo);
            }
            $validated['caminho_arquivo_anexo'] = $request->file('arquivo_anexo')->store('atividades/anexos', 'public');
        }

        unset($validated['remover_anexo'], $validated['arquivo_anexo']);

        $atividade->update($validated);

        return response()->json(
            $atividade->load(['turma:id_turma,nome_identificador', 'disciplina:id_disciplina,nome', 'professor:id,name,email']),
            200
        );
    }

    public function destroy(Atividade $atividade): JsonResponse
    {
        Gate::authorize('delete', $atividade);

        if ($atividade->caminho_arquivo_anexo) {
            Storage::disk('public')->delete($atividade->caminho_arquivo_anexo);
        }

        // Exclui arquivos das submissões vinculadas
        foreach ($atividade->submissoes as $submissao) {
            if ($submissao->caminho_arquivo_entregue) {
                Storage::disk('public')->delete($submissao->caminho_arquivo_entregue);
            }
        }

        $atividade->delete();

        return response()->json(null, 204);
    }

    public function listarPorTurmaEDisciplina(Turma $turma, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('viewAny', Atividade::class);

        $atividades = Atividade::where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplina->id_disciplina)
            ->with(['professor:id,name,email'])
            ->withCount('submissoes')
            ->orderByDesc('data_criacao')
            ->get();

        return response()->json($atividades, 200);
    }

    public function encerrarRecebimentoManualmente(Atividade $atividade): JsonResponse
    {
        Gate::authorize('encerrar', $atividade);

        $atividade->update([
            'status_atividade' => 'Encerrada',
        ]);

        return response()->json($atividade->load(['turma:id_turma,nome_identificador', 'disciplina:id_disciplina,nome']), 200);
    }
}
