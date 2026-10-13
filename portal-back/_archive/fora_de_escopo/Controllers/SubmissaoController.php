<?php

namespace App\Http\Controllers;

use App\Http\Requests\AvaliarSubmissaoRequest;
use App\Http\Requests\StoreSubmissaoRequest;
use App\Http\Requests\UpdateSubmissaoRequest;
use App\Models\Atividade;
use App\Models\Submissao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class SubmissaoController extends Controller
{
    public function index(Atividade $atividade): JsonResponse
    {
        Gate::authorize('viewAny', [Submissao::class, $atividade]);

        $submissoes = $atividade->submissoes()
            ->with(['aluno:id,name,email'])
            ->orderByDesc('data_envio')
            ->get();

        return response()->json([
            'atividade' => $atividade->only(['id_atividade', 'titulo', 'data_limite_entrega', 'valor_pontuacao', 'status_atividade']),
            'total' => $submissoes->count(),
            'submissoes' => $submissoes,
        ], 200);
    }

    public function show(Submissao $submissao): JsonResponse
    {
        Gate::authorize('view', $submissao);

        return response()->json(
            $submissao->load(['atividade', 'aluno:id,name,email']),
            200
        );
    }

    public function minhaSubmissao(Request $request, Atividade $atividade): JsonResponse
    {
        $submissao = $atividade->submissoes()
            ->where('usuario_id', $request->user()->id)
            ->first();

        if (! $submissao) {
            return response()->json([
                'message' => 'Nenhuma submissão enviada para esta atividade até o momento.',
                'submissao' => null,
            ], 200);
        }

        return response()->json($submissao, 200);
    }

    public function store(StoreSubmissaoRequest $request, Atividade $atividade): JsonResponse
    {
        if ($atividade->isEncerrada()) {
            return response()->json([
                'message' => 'O recebimento de resoluções para esta atividade está encerrado ou o prazo limite expirou.',
            ], 422);
        }

        $jaSubmeteu = Submissao::where('atividade_id', $atividade->id_atividade)
            ->where('usuario_id', $request->user()->id)
            ->exists();

        if ($jaSubmeteu) {
            return response()->json([
                'message' => 'Você já enviou uma resolução para esta atividade. Utilize a opção de editar ou cancelar envio.',
            ], 422);
        }

        $caminhoArquivo = null;
        if ($request->hasFile('arquivo')) {
            $caminhoArquivo = $request->file('arquivo')->store('atividades/submissoes', 'public');
        }

        $submissao = Submissao::create([
            'atividade_id' => $atividade->id_atividade,
            'usuario_id' => $request->user()->id,
            'data_envio' => now(),
            'texto_resposta' => $request->input('texto_resposta'),
            'caminho_arquivo_entregue' => $caminhoArquivo,
        ]);

        return response()->json(
            $submissao->load(['atividade:id_atividade,titulo,data_limite_entrega', 'aluno:id,name,email']),
            201
        );
    }

    public function update(UpdateSubmissaoRequest $request, Submissao $submissao): JsonResponse
    {
        if (! $submissao->podeSerModificada()) {
            return response()->json([
                'message' => 'Não é possível editar a submissão após o encerramento do prazo limite ou com a atividade encerrada.',
            ], 422);
        }

        $dados = [];

        if ($request->has('texto_resposta')) {
            $dados['texto_resposta'] = $request->input('texto_resposta');
        }

        if ($request->boolean('remover_arquivo') && $submissao->caminho_arquivo_entregue) {
            Storage::disk('public')->delete($submissao->caminho_arquivo_entregue);
            $dados['caminho_arquivo_entregue'] = null;
        }

        if ($request->hasFile('arquivo')) {
            if ($submissao->caminho_arquivo_entregue) {
                Storage::disk('public')->delete($submissao->caminho_arquivo_entregue);
            }
            $dados['caminho_arquivo_entregue'] = $request->file('arquivo')->store('atividades/submissoes', 'public');
        }

        $dados['data_envio'] = now();

        $submissao->update($dados);

        return response()->json($submissao->load(['atividade', 'aluno:id,name,email']), 200);
    }

    public function destroy(Submissao $submissao): JsonResponse
    {
        Gate::authorize('delete', $submissao);

        if (! $submissao->podeSerModificada()) {
            return response()->json([
                'message' => 'Não é possível cancelar o envio após o encerramento do prazo limite ou com a atividade encerrada.',
            ], 422);
        }

        if ($submissao->caminho_arquivo_entregue) {
            Storage::disk('public')->delete($submissao->caminho_arquivo_entregue);
        }

        $submissao->delete();

        return response()->json(null, 204);
    }

    public function avaliar(AvaliarSubmissaoRequest $request, Submissao $submissao): JsonResponse
    {
        $atividade = $submissao->atividade;

        if ($atividade->valor_pontuacao !== null && $request->float('nota_atribuida') > $atividade->valor_pontuacao) {
            return response()->json([
                'message' => "A nota atribuída ({$request->float('nota_atribuida')}) não pode ser maior que o valor máximo da atividade ({$atividade->valor_pontuacao}).",
            ], 422);
        }

        $dados = [
            'nota_atribuida' => $request->float('nota_atribuida'),
        ];

        if ($request->filled('feedback_comentario_professor')) {
            $dados['feedback_comentario_professor'] = $request->string('feedback_comentario_professor')->toString();
        }

        $submissao->update($dados);

        return response()->json($submissao->load(['aluno:id,name,email', 'atividade']), 200);
    }

    public function feedback(Request $request, Submissao $submissao): JsonResponse
    {
        Gate::authorize('feedback', $submissao);

        $validated = $request->validate([
            'feedback_comentario_professor' => ['required', 'string', 'max:2000'],
        ]);

        $submissao->update([
            'feedback_comentario_professor' => $validated['feedback_comentario_professor'],
        ]);

        return response()->json($submissao->load(['aluno:id,name,email', 'atividade']), 200);
    }
}
