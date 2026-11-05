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
        $query = Emprestimo::query()->with(['livro', 'usuario:id,name,email']);

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
            ->with(['livro', 'usuario:id,name,email'])
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

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Realiza uma nova solicitação de retirada de livro.
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
                    EmprestimoStatus::APROVADO,
                    EmprestimoStatus::RENOVADO,
                    EmprestimoStatus::ATRASADO,
                ])
                ->exists();

            if ($jaSolicitou) {
                abort(422, 'Você já possui uma solicitação ou empréstimo em andamento para este livro.');
            }

            $livro->decrement('quantidade_disponivel');
            $emprestimo = Emprestimo::create([
                'livro_id' => $livro->id_livro,
                'usuario_id' => $request->user()->id,
                'status' => EmprestimoStatus::SOLICITADO,
                'reserva_ativa' => true,
                'observacoes' => $request->filled('observacoes') ? $request->string('observacoes')->toString() : null,
            ]);

        // Reserva o exemplar físico no acervo imediatamente (garante que fique indisponível para outros alunos)
        $livro->decrement('quantidade_disponivel');

        $emprestimo = Emprestimo::create([
            'livro_id' => $livro->id_livro ?? $livro->id,
            'usuario_id' => $request->user()->id,
            'status' => EmprestimoStatus::SOLICITADO,
            'observacoes' => $request->filled('observacoes') ? $request->string('observacoes')->toString() : null,
            'data_emprestimo' => now(),
            'data_prevista_devolucao' => now()->addDays(14),
        ]);

        $emprestimo->load(['livro', 'usuario:id,name,email']);

        return response()->json(new EmprestimoResource($emprestimo), 201);
    }

    /**
     * Cancela uma solicitação pendente e devolve o exemplar ao estoque.
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

            return $emprestimo->load(['livro', 'usuario:id,name,email']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

        // Se o empréstimo foi criado sem pré-decremento (ex.: testes legados)
        if (! $emprestimo->data_emprestimo && $livro->quantidade_disponivel > 0) {
            $livro->decrement('quantidade_disponivel');
        }

        $emprestimo->update([
            'status' => EmprestimoStatus::APROVADO,
            'data_emprestimo' => $emprestimo->data_emprestimo ?? now(),
            'data_prevista_devolucao' => $emprestimo->data_prevista_devolucao ?? now()->addDays(14),
        ]);

            return $emprestimo->load(['livro', 'usuario:id,name,email']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    /**
     * Renova o prazo de devolução de um empréstimo ativo.
     */
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

            if (! in_array($emprestimo->status, [EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO])) {
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

            return $emprestimo->load(['livro', 'usuario:id,name,email']);
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
        Gate::authorize('atualizarStatus', $emprestimo);

        $novoStatus = EmprestimoStatus::from($request->string('status')->toString());
        $statusAntigo = $emprestimo->status;

        $eraReservadoOuAtivo = in_array($statusAntigo, [EmprestimoStatus::SOLICITADO, EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO]);
        $seraReservadoOuAtivo = in_array($novoStatus, [EmprestimoStatus::SOLICITADO, EmprestimoStatus::APROVADO, EmprestimoStatus::RENOVADO, EmprestimoStatus::ATRASADO]);

        if (! $eraReservadoOuAtivo && $seraReservadoOuAtivo) {
            if ($emprestimo->livro->quantidade_disponivel <= 0) {
                return response()->json([
                    'message' => 'Não há exemplares disponíveis para ativar este empréstimo.',
                ], 422);
            }
            $emprestimo->livro->decrement('quantidade_disponivel');
        } elseif ($eraReservadoOuAtivo && ! $seraReservadoOuAtivo) {
            $emprestimo->livro->increment('quantidade_disponivel');
        }

        $dadosAtualizacao = ['status' => $novoStatus];

        if ($request->filled('observacoes')) {
            $dadosAtualizacao['observacoes'] = $request->string('observacoes')->toString();
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
            $dadosAtualizacao['reserva_ativa'] = $estoqueNovoReservado;

            $emprestimo->update($dadosAtualizacao);

            return $emprestimo->load(['livro', 'usuario:id,name,email']);
        });

        return response()->json(new EmprestimoResource($emprestimo), 200);
    }

    private function estoqueReservado(EmprestimoStatus $status): bool
    {
        return in_array($status, [
            EmprestimoStatus::SOLICITADO,
            EmprestimoStatus::APROVADO,
            EmprestimoStatus::RENOVADO,
            EmprestimoStatus::ATRASADO,
        ]);
    }
}
