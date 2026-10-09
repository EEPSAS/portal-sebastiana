<?php

namespace App\Http\Controllers;

use App\Enums\EmprestimoStatus;
use App\Http\Requests\AtualizarStatusEmprestimoRequest;
use App\Http\Requests\SolicitarEmprestimoRequest;
use App\Models\Emprestimo;
use App\Models\Livro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Controller responsável pelo fluxo completo de empréstimos de livros da biblioteca.
class EmprestimoController extends Controller
{
    // Lista empréstimos de acordo com o papel do usuário e filtros aplicados.
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Emprestimo::query()->with(['livro', 'usuario:id,name,email']);

        if (! $user->canManageLibrary()) {
            $query->where('usuario_id', $user->id);
        } elseif ($request->filled('usuario_id')) {
            $query->where('usuario_id', $request->integer('usuario_id'));
        }

        if ($request->filled('livro_id')) {
            $query->where('livro_id', $request->integer('livro_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $emprestimos = $query->orderByDesc('created_at')->get();

        return response()->json($emprestimos, 200);
    }

    // Lista apenas os empréstimos pertencentes ao usuário autenticado.
    public function meusEmprestimos(Request $request): JsonResponse
    {
        $emprestimos = Emprestimo::where('usuario_id', $request->user()->id)
            ->with('livro')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($emprestimos, 200);
    }

    // Exibe os detalhes de um empréstimo específico.
    public function show(Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('view', $emprestimo);

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json($emprestimo, 200);
    }

    // Realiza uma nova solicitação de empréstimo de livro.
    public function solicitar(SolicitarEmprestimoRequest $request): JsonResponse
    {
        Gate::authorize('solicitar', Emprestimo::class);

        $livro = Livro::findOrFail($request->integer('livro_id'));

        if (! $livro->verificarDisponibilidade()) {
            return response()->json([
                'message' => 'Este livro não possui exemplares disponíveis no momento.',
            ], 422);
        }

        $jaSolicitou = Emprestimo::where('usuario_id', $request->user()->id)
            ->where('livro_id', $livro->id_livro)
            ->whereIn('status', [
                EmprestimoStatus::SOLICITADO,
                EmprestimoStatus::APROVADO,
                EmprestimoStatus::RENOVADO,
            ])
            ->exists();

        if ($jaSolicitou) {
            return response()->json([
                'message' => 'Você já possui uma solicitação ou empréstimo em andamento para este livro.',
            ], 422);
        }

        $emprestimo = Emprestimo::create([
            'livro_id' => $livro->id_livro,
            'usuario_id' => $request->user()->id,
            'status' => EmprestimoStatus::SOLICITADO,
            'observacoes' => $request->filled('observacoes') ? $request->string('observacoes')->toString() : null,
        ]);

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json($emprestimo, 201);
    }

    // Aprova uma solicitação de empréstimo e reserva o exemplar.
    public function aprovar(Request $request, Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('aprovar', $emprestimo);

        if ($emprestimo->status !== EmprestimoStatus::SOLICITADO) {
            return response()->json([
                'message' => 'Apenas empréstimos com status "solicitado" podem ser aprovados.',
            ], 422);
        }

        $livro = $emprestimo->livro;

        if ($livro->quantidade_disponivel <= 0) {
            return response()->json([
                'message' => 'Não há exemplares disponíveis para aprovar este empréstimo.',
            ], 422);
        }

        $livro->decrement('quantidade_disponivel');

        $emprestimo->update([
            'status' => EmprestimoStatus::APROVADO,
            'data_emprestimo' => now(),
            'data_prevista_devolucao' => now()->addDays(14),
        ]);

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json($emprestimo, 200);
    }

    // Renova o prazo de devolução de um empréstimo ativo.
    public function renovar(Request $request, Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('renovar', $emprestimo);

        if (! in_array($emprestimo->status, [EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO])) {
            return response()->json([
                'message' => 'Apenas empréstimos aprovados ou renovados podem ser renovados.',
            ], 422);
        }

        if ($emprestimo->data_prevista_devolucao && $emprestimo->data_prevista_devolucao->isPast()) {
            return response()->json([
                'message' => 'Empréstimos com prazo vencido não podem ser renovados automaticamente. Regularize na biblioteca.',
            ], 422);
        }

        $dataBase = $emprestimo->data_prevista_devolucao ?? now();
        $emprestimo->update([
            'status' => EmprestimoStatus::RENOVADO,
            'data_prevista_devolucao' => $dataBase->addDays(14),
        ]);

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json($emprestimo, 200);
    }

    // Registra a devolução do livro e repõe a quantidade disponível no acervo.
    public function registrarDevolucao(Request $request, Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('devolver', $emprestimo);

        if (! in_array($emprestimo->status, [EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO])) {
            return response()->json([
                'message' => 'Este empréstimo não está ativo para registro de devolução.',
            ], 422);
        }

        $emprestimo->livro->increment('quantidade_disponivel');

        $emprestimo->update([
            'status' => EmprestimoStatus::DEVOLVIDO,
            'data_devolucao_real' => now(),
        ]);

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json($emprestimo, 200);
    }

    // Atualiza manualmente o status e dados de um empréstimo.
    public function atualizarStatus(AtualizarStatusEmprestimoRequest $request, Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('atualizarStatus', $emprestimo);

        $novoStatus = EmprestimoStatus::from($request->string('status')->toString());
        $statusAntigo = $emprestimo->status;

        $eraAtivo = in_array($statusAntigo, [EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO]);
        $seraAtivo = in_array($novoStatus, [EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO]);

        // Ajusta disponibilidade caso o status mude entre ativo e inativo
        if (! $eraAtivo && $seraAtivo) {
            if ($emprestimo->livro->quantidade_disponivel <= 0) {
                return response()->json([
                    'message' => 'Não há exemplares disponíveis para ativar este empréstimo.',
                ], 422);
            }
            $emprestimo->livro->decrement('quantidade_disponivel');
        } elseif ($eraAtivo && ! $seraAtivo) {
            $emprestimo->livro->increment('quantidade_disponivel');
        }

        $dadosAtualizacao = ['status' => $novoStatus];

        if ($request->filled('observacoes')) {
            $dadosAtualizacao['observacoes'] = $request->string('observacoes')->toString();
        }

        if ($request->filled('data_prevista_devolucao')) {
            $dadosAtualizacao['data_prevista_devolucao'] = $request->string('data_prevista_devolucao')->toString();
        }

        if ($novoStatus === EmprestimoStatus::DEVOLVIDO && ! $emprestimo->data_devolucao_real) {
            $dadosAtualizacao['data_devolucao_real'] = now();
        }

        $emprestimo->update($dadosAtualizacao);
        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json($emprestimo, 200);
    }
}
