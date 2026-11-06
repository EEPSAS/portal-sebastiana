<?php

namespace App\Http\Controllers;

use App\Enums\EmprestimoStatus;
use App\Http\Requests\AtualizarStatusEmprestimoRequest;
use App\Http\Requests\SolicitarEmprestimoRequest;
use App\Http\Resources\EmprestimoResource;
use App\Models\Emprestimo;
use App\Models\Livro;
use App\Services\NotificacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo fluxo completo de empréstimos e devoluções de livros do acervo.
 */
class EmprestimoController extends Controller
{
    public function __construct(private readonly NotificacaoService $notificacaoService) {}

    /**
     * Lista empréstimos de acordo com o papel do usuário (aluno vê os seus, bibliotecário vê todos).
     *
     * @return JsonResponse Coleção formatada pelo EmprestimoResource
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Emprestimo::query()->with(['livro', 'usuario:id,name,email,role']);

        // Usuário sem permissão de gestão de biblioteca vê apenas suas próprias retiradas
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

        return response()->json(EmprestimoResource::collection($emprestimos), 200);
    }

    /**
     * Lista apenas os empréstimos pertencentes ao usuário autenticado.
     */
    public function meusEmprestimos(Request $request): JsonResponse
    {
        $emprestimos = Emprestimo::where('usuario_id', $request->user()->id)
            ->with(['livro', 'usuario:id,name,email,role'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(EmprestimoResource::collection($emprestimos), 200);
    }

    /**
     * Exibe os detalhes de um empréstimo específico.
     */
    public function show(Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('view', $emprestimo);

        $emprestimo->load(['livro', 'usuario:id,name,email,role']);

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Realiza uma nova solicitação de retirada de livro, reservando o exemplar no estoque
     * sem iniciar a contagem do prazo de devolução até a entrega física no balcão.
     *
     * @param  SolicitarEmprestimoRequest  $request  Form Request validada
     */
    public function solicitar(SolicitarEmprestimoRequest $request): JsonResponse
    {
        Gate::authorize('solicitar', Emprestimo::class);

        $emprestimo = DB::transaction(function () use ($request) {
            // O bloqueio serializa solicitações concorrentes para o último exemplar.
            $livro = Livro::query()->lockForUpdate()->findOrFail($request->integer('livro_id'));

            if (! $livro->verificarDisponibilidade()) {
                abort(422, 'Este livro não possui exemplares disponíveis no momento.');
            }

            $jaSolicitou = Emprestimo::query()
                ->where('usuario_id', $request->user()->id)
                ->where('livro_id', $livro->id_livro)
                ->whereIn('status', [
                    EmprestimoStatus::SOLICITADO,
                    EmprestimoStatus::ENTREGUE,
                    EmprestimoStatus::RENOVADO,
                    EmprestimoStatus::ATRASADO,
                ])
                ->exists();

            if ($jaSolicitou) {
                abort(422, 'Você já possui uma solicitação ou empréstimo em andamento para este livro.');
            }

            // Reserva o exemplar físico no acervo imediatamente para evitar dupla retirada
            $livro->decrement('quantidade_disponivel');

            $emprestimo = Emprestimo::create([
                'livro_id' => $livro->id_livro,
                'usuario_id' => $request->user()->id,
                'status' => EmprestimoStatus::SOLICITADO,
                'reserva_ativa' => true,
                'observacoes' => $request->filled('observacoes') ? $request->string('observacoes')->toString() : null,
            ]);

            $this->notificacaoService->notificarSolicitacaoEmprestimo($emprestimo);

            return $emprestimo;
        });

        $emprestimo->load(['livro', 'usuario:id,name,email,role']);

        return response()->json(new EmprestimoResource($emprestimo), 201);
    }

    /**
     * Cancela uma solicitação pendente e devolve o exemplar reservado ao estoque.
     */
    public function cancelarSolicitacao(Emprestimo $emprestimo): JsonResponse
    {
        $emprestimo = DB::transaction(function () use ($emprestimo) {
            $emprestimo = Emprestimo::query()
                ->lockForUpdate()
                ->findOrFail($emprestimo->id_emprestimo);
            Gate::authorize('cancelar', $emprestimo);

            if ($emprestimo->reserva_ativa) {
                Livro::query()->lockForUpdate()->findOrFail($emprestimo->livro_id)
                    ->increment('quantidade_disponivel');
            }

            $emprestimo->update([
                'status' => EmprestimoStatus::RECUSADO,
                'reserva_ativa' => false,
            ]);

            return $emprestimo->load(['livro', 'usuario:id,name,email,role']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Registra a entrega física do exemplar ao aluno no balcão da biblioteca,
     * iniciando a posse do livro e a contagem oficial do prazo de 14 dias.
     */
    public function entregar(Request $request, Emprestimo $emprestimo): JsonResponse
    {
        $emprestimo = DB::transaction(function () use ($emprestimo) {
            $emprestimo = Emprestimo::query()
                ->lockForUpdate()
                ->findOrFail($emprestimo->id_emprestimo);
            Gate::authorize('entregar', $emprestimo);

            if ($emprestimo->status !== EmprestimoStatus::SOLICITADO) {
                abort(422, 'Apenas empréstimos com status "solicitado" podem ser registrados como entregues.');
            }

            // Garante baixa única de estoque caso seja um pedido legado criado sem reserva prévia
            if (! $emprestimo->reserva_ativa) {
                $livro = Livro::query()->lockForUpdate()->findOrFail($emprestimo->livro_id);
                if (! $livro->verificarDisponibilidade()) {
                    abort(422, 'Não há exemplares disponíveis para entregar este empréstimo.');
                }
                $livro->decrement('quantidade_disponivel');
            }

            // Inicia a contagem oficial do tempo no momento em que o livro passa à posse do aluno
            $emprestimo->update([
                'status' => EmprestimoStatus::ENTREGUE,
                'reserva_ativa' => true,
                'data_emprestimo' => now(),
                'data_prevista_devolucao' => now()->addDays(14),
            ]);

            return $emprestimo->load(['livro', 'usuario:id,name,email,role']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Renova o prazo de devolução de um empréstimo ativo (entregue ou já renovado).
     */
    public function renovar(Request $request, Emprestimo $emprestimo): JsonResponse
    {
        Gate::authorize('renovar', $emprestimo);

        if (! in_array($emprestimo->status, [EmprestimoStatus::ENTREGUE, EmprestimoStatus::RENOVADO])) {
            return response()->json([
                'message' => 'Apenas empréstimos entregues ou renovados podem ser renovados.',
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

        $emprestimo->load(['livro', 'usuario:id,name,email,role']);

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Registra a devolução do livro e incrementa o estoque do acervo.
     */
    public function registrarDevolucao(Request $request, Emprestimo $emprestimo): JsonResponse
    {
        $emprestimo = DB::transaction(function () use ($emprestimo) {
            $emprestimo = Emprestimo::query()
                ->lockForUpdate()
                ->findOrFail($emprestimo->id_emprestimo);
            Gate::authorize('devolver', $emprestimo);

            if (! in_array($emprestimo->status, [EmprestimoStatus::ENTREGUE, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO])) {
                abort(422, 'Este empréstimo não está ativo para registro de devolução.');
            }

            if ($emprestimo->reserva_ativa) {
                Livro::query()->lockForUpdate()->findOrFail($emprestimo->livro_id)
                    ->increment('quantidade_disponivel');
            }
            $emprestimo->update([
                'status' => EmprestimoStatus::DEVOLVIDO,
                'reserva_ativa' => false,
                'data_devolucao_real' => now(),
            ]);

            return $emprestimo->load(['livro', 'usuario:id,name,email,role']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Atualiza o status e parâmetros do empréstimo via formulário administrativo.
     *
     * @param  AtualizarStatusEmprestimoRequest  $request  Form Request validada
     */
    public function atualizarStatus(AtualizarStatusEmprestimoRequest $request, Emprestimo $emprestimo): JsonResponse
    {
        $dados = $request->validated();

        $emprestimo = DB::transaction(function () use ($request, $emprestimo, $dados) {
            $emprestimo = Emprestimo::query()
                ->lockForUpdate()
                ->findOrFail($emprestimo->id_emprestimo);
            Gate::authorize('atualizarStatus', $emprestimo);

            $novoStatus = EmprestimoStatus::from($dados['status']);
            $estoqueAntigoReservado = (bool) $emprestimo->reserva_ativa;
            $estoqueNovoReservado = $this->estoqueReservado($novoStatus);

            // Ajusta o estoque atomicamente apenas quando há transição entre reservado e livre
            if (! $estoqueAntigoReservado && $estoqueNovoReservado) {
                $livro = Livro::query()->lockForUpdate()->findOrFail($emprestimo->livro_id);
                if (! $livro->verificarDisponibilidade()) {
                    abort(422, 'Não há exemplares disponíveis para ativar este empréstimo.');
                }
                $livro->decrement('quantidade_disponivel');
            } elseif ($estoqueAntigoReservado && ! $estoqueNovoReservado) {
                Livro::query()->lockForUpdate()->findOrFail($emprestimo->livro_id)
                    ->increment('quantidade_disponivel');
            }

            $dadosAtualizacao = [
                'status' => $novoStatus,
                'reserva_ativa' => $estoqueNovoReservado,
            ];

            if ($request->filled('observacoes')) {
                $dadosAtualizacao['observacoes'] = $request->string('observacoes')->toString();
            }

            // Ao marcar manualmente como entregue, inicia a contagem de tempo se ainda não houver data de retirada
            if ($novoStatus === EmprestimoStatus::ENTREGUE && ! $emprestimo->data_emprestimo) {
                $dadosAtualizacao['data_emprestimo'] = now();
                $dadosAtualizacao['data_prevista_devolucao'] = now()->addDays(14);
            }

            if ($request->filled('data_prevista_devolucao')) {
                $dadosAtualizacao['data_prevista_devolucao'] = $request->string('data_prevista_devolucao')->toString();
            }

            if ($novoStatus === EmprestimoStatus::DEVOLVIDO && ! $emprestimo->data_devolucao_real) {
                $dadosAtualizacao['data_devolucao_real'] = now();
            }

            $emprestimo->update($dadosAtualizacao);

            return $emprestimo->load(['livro', 'usuario:id,name,email,role']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    private function estoqueReservado(EmprestimoStatus $status): bool
    {
        return in_array($status, [
            EmprestimoStatus::SOLICITADO,
            EmprestimoStatus::ENTREGUE,
            EmprestimoStatus::RENOVADO,
            EmprestimoStatus::ATRASADO,
        ]);
    }
}
