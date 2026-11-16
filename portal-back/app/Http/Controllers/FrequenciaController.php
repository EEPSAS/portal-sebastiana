<?php

namespace App\Http\Controllers;

use App\Http\Requests\GerarRelatorioFaltasRequest;
use App\Http\Requests\StoreFrequenciaManualRequest;
use App\Http\Resources\FrequenciaResource;
use App\Models\Frequencia;
use App\Models\Turma;
use App\Services\NotificacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

// Controller responsável pela consulta e relatório consolidado de frequências.
class FrequenciaController extends Controller
{
    public function __construct(private readonly NotificacaoService $notificacaoService) {}

    // Grava a frequência de um aluno e atualiza os alertas do período correspondente.
    public function registrarManual(StoreFrequenciaManualRequest $request): JsonResponse
    {
        Gate::authorize('manage', Frequencia::class);

        $dados = $request->validated();
        $frequencia = DB::transaction(function () use ($dados) {
            $frequencia = Frequencia::updateOrCreate(
                [
                    'turma_id' => $dados['turma_id'],
                    'disciplina_id' => $dados['disciplina_id'],
                    'usuario_id' => $dados['usuario_id'],
                    'data_aula' => $dados['data_aula'],
                ],
                [
                    'quantidade_aulas' => $dados['quantidade_aulas'],
                    'status_presenca' => $dados['status_presenca'],
                    'justificativa' => $dados['justificativa'] ?? null,
                ]
            );

            $frequencia->load(['aluno:id,name,email', 'disciplina', 'turma']);
            $mes = (int) substr($dados['data_aula'], 5, 2);
            $trimestre = $mes <= 4 ? 1 : ($mes <= 8 ? 2 : 3);

            // Usa o mesmo cálculo de risco de frequência aplicado depois da importação CSV.
            $this->notificacaoService->notificarImportacaoAcademica(
                $frequencia->turma,
                [[
                    'usuario_id' => $frequencia->usuario_id,
                    'notas' => [],
                    'faltas' => [['disciplina_id' => $frequencia->disciplina_id]],
                ]],
                "{$trimestre}º Trimestre",
                $dados['data_aula']
            );

            return $frequencia;
        });

        return response()->json(new FrequenciaResource($frequencia), 201);
    }

    // Gera relatório consolidado de faltas e taxa de presença da turma.
    public function gerarRelatorioFaltas(GerarRelatorioFaltasRequest $request): JsonResponse
    {
        Gate::authorize('manage', Frequencia::class);

        // Consome filtros validados na camada de Form Request
        $validated = $request->validated();

        $turma = Turma::findOrFail($validated['turma_id']);
        $alunos = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();

        $relatorio = $alunos->map(function ($aluno) use ($validated) {
            $query = Frequencia::where('usuario_id', $aluno->id)
                ->where('turma_id', $validated['turma_id']);

            if (! empty($validated['disciplina_id'])) {
                $query->where('disciplina_id', $validated['disciplina_id']);
            }

            $totalAulas = (int) $query->sum('quantidade_aulas');
            $faltas = (int) (clone $query)->where('status_presenca', 'Falta')->sum('quantidade_aulas');
            $faltasJustificadas = (int) (clone $query)->where('status_presenca', 'Falta Justificada')->sum('quantidade_aulas');
            $presencas = (int) (clone $query)->where('status_presenca', 'Presente')->sum('quantidade_aulas');

            $taxaPresenca = $totalAulas > 0 ? round(($presencas / $totalAulas) * 100, 1) : 100.0;

            return [
                'aluno_id' => $aluno->id,
                'nome' => $aluno->name,
                'email' => $aluno->email,
                'total_aulas' => $totalAulas,
                'presencas' => $presencas,
                'faltas' => $faltas,
                'faltas_justificadas' => $faltasJustificadas,
                'percentual_presenca' => $taxaPresenca,
            ];
        });

        return response()->json([
            'turma' => $turma->only(['id_turma', 'nome_identificador', 'ano_letivo']),
            'relatorio' => $relatorio,
        ], 200);
    }

    // Permite ao aluno consultar seu próprio histórico e resumo de frequência.
    public function consultarFrequenciaPropria(Request $request): JsonResponse
    {
        $alunoId = $request->user()->id;

        $frequencias = Frequencia::where('usuario_id', $alunoId)
            ->with(['disciplina:id_disciplina,nome', 'turma:id_turma,nome_identificador'])
            ->orderByDesc('data_aula')
            ->get();

        $totalAulas = (int) $frequencias->sum('quantidade_aulas');
        $faltas = (int) $frequencias->where('status_presenca', 'Falta')->sum('quantidade_aulas');
        $presencas = (int) $frequencias->where('status_presenca', 'Presente')->sum('quantidade_aulas');
        $taxaPresenca = $totalAulas > 0 ? round(($presencas / $totalAulas) * 100, 1) : 100.0;

        return response()->json([
            'resumo' => [
                'total_aulas' => $totalAulas,
                'presencas' => $presencas,
                'faltas' => $faltas,
                'percentual_presenca' => $taxaPresenca,
            ],
            'registros' => $frequencias,
        ], 200);
    }
}
