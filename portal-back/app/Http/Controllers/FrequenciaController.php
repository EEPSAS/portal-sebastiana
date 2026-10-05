<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConsolidarChamadaRequest;
use App\Models\Frequencia;
use App\Models\Turma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

// Controller responsável pelo lançamento, consolidação e relatório de frequências.
class FrequenciaController extends Controller
{
    // Consolida a chamada diária para todos os alunos de uma turma em lote.
    public function consolidarChamadaDiaria(ConsolidarChamadaRequest $request): JsonResponse
    {
        Gate::authorize('manage', Frequencia::class);

        $dados = $request->validated();
        $registrosSalvos = [];

        DB::transaction(function () use ($dados, &$registrosSalvos) {
            foreach ($dados['chamada'] as $item) {
                $registro = Frequencia::updateOrCreate(
                    [
                        'turma_id' => $dados['turma_id'],
                        'disciplina_id' => $dados['disciplina_id'],
                        'usuario_id' => $item['usuario_id'],
                        'data_aula' => $dados['data_aula'],
                    ],
                    [
                        'quantidade_aulas' => $dados['quantidade_aulas'] ?? 1,
                        'status_presenca' => $item['status_presenca'],
                        'justificativa' => $item['justificativa'] ?? null,
                        'remessa_origem_id' => $dados['remessa_origem_id'] ?? null,
                    ]
                );

                $registrosSalvos[] = $registro;
            }
        });

        return response()->json([
            'message' => 'Chamada consolidada com sucesso.',
            'total' => count($registrosSalvos),
            'frequencias' => $registrosSalvos,
        ], 201);
    }

    // Atualiza a presença ou falta de um aluno individualmente.
    public function atualizarPresencaIndividual(Request $request, Frequencia $frequencia): JsonResponse
    {
        Gate::authorize('manage', Frequencia::class);

        $validated = $request->validate([
            'status_presenca' => ['required', 'string', 'in:Presente,Falta,Falta Justificada'],
            'quantidade_aulas' => ['nullable', 'integer', 'min:1', 'max:10'],
            'justificativa' => ['nullable', 'string', 'max:500'],
        ]);

        $frequencia->update($validated);

        return response()->json($frequencia->load(['aluno:id,name,email', 'disciplina', 'turma']), 200);
    }

    // Gera relatório consolidado de faltas e taxa de presença da turma.
    public function gerarRelatorioFaltas(Request $request): JsonResponse
    {
        Gate::authorize('manage', Frequencia::class);

        $validated = $request->validate([
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['nullable', 'exists:disciplinas,id_disciplina'],
        ]);

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
