<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotaRequest;
use App\Models\Disciplina;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NotaController extends Controller
{
    public function lancarNotaOficial(StoreNotaRequest $request): JsonResponse
    {
        Gate::authorize('manage', Nota::class);

        $dados = $request->validated();
        if (! isset($dados['data_registro'])) {
            $dados['data_registro'] = now()->format('Y-m-d');
        }

        $nota = Nota::create($dados);

        return response()->json($nota->load(['aluno:id,name,email', 'disciplina', 'turma']), 201);
    }

    public function atualizarNota(Request $request, Nota $nota): JsonResponse
    {
        Gate::authorize('manage', Nota::class);

        $validated = $request->validate([
            'valor_nota' => ['sometimes', 'required', 'numeric', 'min:0'],
            'valor_maximo' => ['nullable', 'numeric', 'min:0.1'],
            'tipo_avaliacao' => ['sometimes', 'required', 'string', 'max:100'],
            'periodo_letivo' => ['sometimes', 'required', 'string', 'max:50'],
            'observacoes' => ['nullable', 'string', 'max:255'],
        ]);

        $nota->update($validated);

        return response()->json($nota->load(['aluno:id,name,email', 'disciplina', 'turma']), 200);
    }

    public function deletarNota(Nota $nota): JsonResponse
    {
        Gate::authorize('manage', Nota::class);

        $nota->delete();

        return response()->json(null, 204);
    }

    public function calcularMediaPeriodo(Request $request): JsonResponse
    {
        Gate::authorize('manage', Nota::class);

        $validated = $request->validate([
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'periodo_letivo' => ['required', 'string'],
        ]);

        $turma = Turma::findOrFail($validated['turma_id']);
        $disciplina = Disciplina::findOrFail($validated['disciplina_id']);
        $alunos = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();

        $medias = $alunos->map(function ($aluno) use ($validated) {
            $notas = Nota::where('usuario_id', $aluno->id)
                ->where('turma_id', $validated['turma_id'])
                ->where('disciplina_id', $validated['disciplina_id'])
                ->where('periodo_letivo', $validated['periodo_letivo'])
                ->get();

            $media = $notas->count() > 0 ? round($notas->avg('valor_nota'), 2) : null;

            return [
                'aluno_id' => $aluno->id,
                'nome' => $aluno->name,
                'media' => $media,
                'avaliacoes' => $notas->count(),
            ];
        });

        return response()->json([
            'turma' => $turma->only(['id_turma', 'nome_identificador']),
            'disciplina' => $disciplina->only(['id_disciplina', 'nome']),
            'periodo_letivo' => $validated['periodo_letivo'],
            'medias' => $medias,
        ], 200);
    }

    public function gerarBoletim(User $usuario): JsonResponse
    {
        Gate::authorize('manage', Nota::class);

        return response()->json($this->construirBoletim($usuario), 200);
    }

    public function consultarNotaPropria(Request $request): JsonResponse
    {
        return response()->json($this->construirBoletim($request->user()), 200);
    }

    private function construirBoletim(User $aluno): array
    {
        $notas = Nota::where('usuario_id', $aluno->id)
            ->with(['disciplina:id_disciplina,nome', 'turma:id_turma,nome_identificador,ano_letivo'])
            ->get();

        $disciplinasAgrupadas = $notas->groupBy('disciplina_id');
        $boletimDisciplinas = [];

        foreach ($disciplinasAgrupadas as $disciplinaId => $listaNotas) {
            $nomeDisciplina = $listaNotas->first()->disciplina->nome ?? 'Disciplina '.$disciplinaId;

            $bimestres = [
                '1º Bimestre' => round($listaNotas->where('periodo_letivo', '1º Bimestre')->avg('valor_nota') ?? 0, 2),
                '2º Bimestre' => round($listaNotas->where('periodo_letivo', '2º Bimestre')->avg('valor_nota') ?? 0, 2),
                '3º Bimestre' => round($listaNotas->where('periodo_letivo', '3º Bimestre')->avg('valor_nota') ?? 0, 2),
                '4º Bimestre' => round($listaNotas->where('periodo_letivo', '4º Bimestre')->avg('valor_nota') ?? 0, 2),
            ];

            $bimestresValidos = array_filter($bimestres, fn ($val) => $val > 0);
            $mediaFinal = count($bimestresValidos) > 0 ? round(array_sum($bimestresValidos) / count($bimestresValidos), 2) : 0;

            $boletimDisciplinas[] = [
                'disciplina_id' => $disciplinaId,
                'disciplina' => $nomeDisciplina,
                'notas_periodo' => $bimestres,
                'media_final' => $mediaFinal,
                'status' => $mediaFinal >= 6.0 ? 'Aprovado' : 'Em Curso',
            ];
        }

        return [
            'aluno' => $aluno->only(['id', 'name', 'email']),
            'disciplinas' => $boletimDisciplinas,
        ];
    }
}
