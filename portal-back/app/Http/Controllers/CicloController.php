<?php

namespace App\Http\Controllers;

use App\Data\Academico\SalvarCicloData;
use App\Http\Requests\StoreCicloRequest;
use App\Http\Resources\CicloResource;
use App\Http\Resources\DisciplinaResource;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller responsável pela gestão dos Ciclos Escolares (ex: 1º Ano, 2º Ano, 3º Ano)
 * e agrupamento pedagógico de Disciplinas (Itens 3.1 e 3.2).
 */
class CicloController extends Controller
{
    /**
     * Lista todos os ciclos escolares com suas respectivas disciplinas, professores e turmas.
     * Inclui também eventuais disciplinas ainda não associadas a nenhum ciclo.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Visão Isolada do Professor (Visualiza única e exclusivamente suas disciplinas e turmas vinculadas)
        if ($user && $user->isProfessor() && ! $user->isAdm()) {
            foreach ($user->disciplinasDocente as $discDocente) {
                $discDocente->sincronizarComTurmasDosCiclos();
            }

            $disciplinaIds = $user->disciplinasDocente()->pluck('disciplinas.id_disciplina')
                ->merge($user->turmaDisciplinasDocente()->pluck('disciplina_id'))
                ->filter()
                ->unique()
                ->values()
                ->all();

            $ciclos = Ciclo::whereHas('disciplinas', fn ($q) => $q->whereIn('disciplinas.id_disciplina', $disciplinaIds))
                ->with([
                    'disciplinas' => fn ($q) => $q->whereIn('disciplinas.id_disciplina', $disciplinaIds)
                        ->with(['ciclos', 'professores'])
                        ->orderBy('nome'),
                    'turmas' => fn ($q) => $q->whereHas('turmaDisciplinas', fn ($td) => $td->where('professor_id', $user->id))
                        ->orderBy('nome_identificador'),
                ])
                ->withCount([
                    'disciplinas' => fn ($q) => $q->whereIn('disciplinas.id_disciplina', $disciplinaIds),
                    'turmas' => fn ($q) => $q->whereHas('turmaDisciplinas', fn ($td) => $td->where('professor_id', $user->id)),
                ])
                ->orderBy('nome')
                ->get();

            $disciplinasSemCiclo = Disciplina::doesntHave('ciclos')
                ->whereIn('id_disciplina', $disciplinaIds)
                ->with(['ciclos', 'professores'])
                ->orderBy('nome')
                ->get();
        } else {
            // 2. Visão Global (Especialista e Administrador com acesso a todos os ciclos e catálogo)
            $ciclos = Ciclo::with([
                'disciplinas' => fn ($q) => $q->with(['ciclos', 'professores'])->orderBy('nome'),
                'turmas' => fn ($q) => $q->orderBy('nome_identificador'),
            ])
                ->withCount(['disciplinas', 'turmas'])
                ->orderBy('nome')
                ->get();

            // Disciplinas que ainda não foram vinculadas a nenhum ciclo escolar
            $disciplinasSemCiclo = Disciplina::doesntHave('ciclos')
                ->with(['ciclos', 'professores'])
                ->orderBy('nome')
                ->get();
        }

        // Caso o usuário seja Aluno, identifica sua turma ativa e as disciplinas que ele cursa
        $minhaTurma = null;
        $minhasDisciplinas = [];
        if ($user && $user->isAluno()) {
            $turmaAtiva = $user->turma_ativa;
            if ($turmaAtiva) {
                $turmaAtiva->load(['ciclo', 'turmaDisciplinas.disciplina.ciclos', 'turmaDisciplinas.disciplina.professores', 'turmaDisciplinas.professor']);
                $minhaTurma = [
                    'id_turma' => $turmaAtiva->id_turma,
                    'nome_identificador' => $turmaAtiva->nome_identificador,
                    'turno' => $turmaAtiva->turno,
                    'ano_letivo' => (int) $turmaAtiva->ano_letivo,
                    'ciclo_id' => $turmaAtiva->ciclo_id,
                    'ciclo_nome' => $turmaAtiva->ciclo?->nome,
                ];

                // Extrai as disciplinas da turma ativa do aluno (ou do ciclo da turma)
                $discColecao = $turmaAtiva->turmaDisciplinas
                    ->filter(fn ($td) => $td->disciplina !== null)
                    ->map(fn ($td) => $td->disciplina);

                if ($discColecao->isEmpty() && $turmaAtiva->ciclo) {
                    $discColecao = $turmaAtiva->ciclo->disciplinas;
                }

                $minhasDisciplinas = DisciplinaResource::collection($discColecao->unique('id_disciplina')->values());
            }
        }

        return response()->json([
            'data' => CicloResource::collection($ciclos),
            'disciplinas_sem_ciclo' => DisciplinaResource::collection($disciplinasSemCiclo),
            'minha_turma' => $minhaTurma,
            'minhas_disciplinas' => $minhasDisciplinas,
        ], 200);
    }

    /**
     * Cria um novo Ciclo Escolar (ex: "1º Ano", "2º Ano").
     */
    public function store(StoreCicloRequest $request): JsonResponse
    {
        // Revalida e tipa o payload via Spatie Laravel Data antes de persistir
        $dadosCiclo = SalvarCicloData::validateAndCreate($request->validated());
        $ciclo = Ciclo::create($dadosCiclo->toArray());
        $ciclo->load(['disciplinas.professores', 'turmas']);

        return response()->json([
            'message' => "Ciclo '{$ciclo->nome}' criado com sucesso.",
            'data' => new CicloResource($ciclo),
        ], 201);
    }

    /**
     * Atualiza o nome ou descrição de um Ciclo Escolar existente.
     */
    public function update(StoreCicloRequest $request, Ciclo $ciclo): JsonResponse
    {
        // Revalida e tipa a atualização via Spatie Laravel Data
        $dadosCiclo = SalvarCicloData::validateAndCreate($request->validated());
        $ciclo->update($dadosCiclo->toArray());
        $ciclo->load(['disciplinas.professores', 'turmas']);

        return response()->json([
            'message' => "Ciclo '{$ciclo->nome}' atualizado com sucesso.",
            'data' => new CicloResource($ciclo),
        ], 200);
    }

    /**
     * Remove um Ciclo Escolar (preservando as disciplinas e turmas cadastradas).
     */
    public function destroy(Request $request, Ciclo $ciclo): JsonResponse
    {
        if (! $request->user()?->canManageAcademic()) {
            abort(403, 'Apenas o Especialista Pedagógico ou Administrador pode excluir ciclos escolares.');
        }

        // Desfaz explicitamente os vínculos: as disciplinas viram "órfãs" e NÃO são excluídas
        $ciclo->disciplinas()->detach();

        // Turmas do ciclo ficam sem ciclo (preserva turmas e alocações/notas)
        $ciclo->turmas()->update(['ciclo_id' => null]);

        $ciclo->delete();

        return response()->json(null, 204);
    }

    /**
     * Vincula uma disciplina existente ao ciclo escolar.
     */
    public function vincularDisciplina(Request $request, Ciclo $ciclo): JsonResponse
    {
        if (! $request->user()?->canManageAcademic()) {
            abort(403, 'Apenas o Especialista Pedagógico ou Administrador pode vincular disciplinas a ciclos escolares.');
        }

        $validated = $request->validate([
            'disciplina_id' => ['required', 'integer', 'exists:disciplinas,id_disciplina'],
        ]);

        $disciplina = Disciplina::findOrFail($validated['disciplina_id']);
        $ciclo->disciplinas()->syncWithoutDetaching([$disciplina->id_disciplina]);
        $disciplina->sincronizarComTurmasDosCiclos();
        $ciclo->turmas()->get()->each(fn ($turma) => $turma->herdarDisciplinasDoCiclo());

        return response()->json([
            'message' => "Disciplina '{$disciplina->nome}' vinculada ao ciclo '{$ciclo->nome}' com sucesso.",
            'data' => new CicloResource($ciclo->fresh(['disciplinas.professores', 'turmas'])),
        ], 200);
    }

    /**
     * Desvincula uma disciplina do ciclo escolar (sem excluí-la do catálogo escolar).
     */
    public function desvincularDisciplina(Request $request, Ciclo $ciclo, Disciplina $disciplina): JsonResponse
    {
        if (! $request->user()?->canManageAcademic()) {
            abort(403, 'Apenas o Especialista Pedagógico ou Administrador pode desvincular disciplinas de ciclos escolares.');
        }

        $ciclo->disciplinas()->detach($disciplina->id_disciplina);

        // Remove o vínculo da disciplina nas turmas pertencentes a este ciclo
        $turmaIdsDoCiclo = $ciclo->turmas()->pluck('id_turma')->all();
        if (! empty($turmaIdsDoCiclo)) {
            TurmaDisciplina::whereIn('turma_id', $turmaIdsDoCiclo)
                ->where('disciplina_id', $disciplina->id_disciplina)
                ->delete();
        }

        $disciplina->sincronizarComTurmasDosCiclos();

        return response()->json([
            'message' => "Disciplina '{$disciplina->nome}' desvinculada do ciclo '{$ciclo->nome}' com sucesso.",
            'data' => new CicloResource($ciclo->fresh(['disciplinas.professores', 'turmas'])),
        ], 200);
    }
}
