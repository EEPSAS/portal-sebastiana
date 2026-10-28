<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisciplinaRequest;
use App\Http\Requests\UpdateDisciplinaRequest;
use App\Http\Resources\DisciplinaResource;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\TurmaDisciplina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo cadastro de disciplinas, vínculo com Ciclos Escolares
 * e propagação automática para turmas e professores (Diretriz 3).
 */
class DisciplinaController extends Controller
{
    /**
     * Lista as disciplinas curriculares cadastradas com seus respectivos Ciclos e Professores.
     *
     * @return JsonResponse Coleção de disciplinas formatada pelo DisciplinaResource
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Disciplina::class);

        $query = Disciplina::with(['ciclos', 'professores']);

        // Filtra pelo nome da disciplina quando o parâmetro de busca 'q' é informado
        if ($request->filled('q')) {
            $query->where('nome', 'like', '%'.$request->string('q')->toString().'%');
        }

        // Filtra opcionalmente por ciclo escolar específico
        if ($request->filled('ciclo_id')) {
            $cicloId = $request->integer('ciclo_id');
            $query->whereHas('ciclos', fn ($q) => $q->where('ciclos.id_ciclo', $cicloId));
        }

        // Ordena alfabeticamente pela coluna 'nome' da tabela 'disciplinas'
        $disciplinas = $query->orderBy('nome')->get();

        return response()->json(DisciplinaResource::collection($disciplinas), 200);
    }

    /**
     * Cadastra e persiste uma nova disciplina, permitindo vinculá-la a Ciclos existentes
     * e/ou criar um novo Ciclo na hora (Itens 3.1, 3.2 e 3.3).
     *
     * @param  StoreDisciplinaRequest  $request  Form Request validada
     */
    public function store(StoreDisciplinaRequest $request): JsonResponse
    {
        Gate::authorize('create', Disciplina::class);

        $validated = $request->validated();

        $disciplina = Disciplina::create([
            'nome' => $validated['nome'],
            'aulas_semanais' => $validated['aulas_semanais'],
            'carga_horaria_anual' => $validated['carga_horaria_anual'],
            'descricao' => $validated['descricao'] ?? null,
            'ementa' => $validated['ementa'] ?? null,
            'habilidades_bncc' => $validated['habilidades_bncc'] ?? null,
            'objetivo_geral' => $validated['objetivo_geral'] ?? null,
            'objetivo_especifico' => $validated['objetivo_especifico'] ?? null,
        ]);

        // Processa vínculo com Ciclos existentes e/ou criação de novo Ciclo na hora (Item 3.1)
        $cicloIds = collect($validated['ciclo_ids'] ?? [])->map(fn ($id) => (int) $id)->all();

        if (! empty($validated['novo_ciclo_nome'])) {
            $novoCiclo = Ciclo::firstOrCreate([
                'nome' => trim($validated['novo_ciclo_nome']),
            ]);
            $cicloIds[] = $novoCiclo->id_ciclo;
        }

        if (! empty($cicloIds)) {
            $disciplina->ciclos()->sync(array_values(array_unique($cicloIds)));
        }

        if (! empty($validated['professor_ids'])) {
            $disciplina->professores()->sync($validated['professor_ids']);
        }

        // Propaga a disciplina para todas as turmas pertencentes aos Ciclos vinculados (Item 3.2a)
        $disciplina->sincronizarComTurmasDosCiclos();
        $disciplina->load(['ciclos', 'professores']);

        return response()->json(new DisciplinaResource($disciplina), 201);
    }

    /**
     * Exibe os detalhes de uma disciplina.
     */
    public function show(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('view', $disciplina);

        $disciplina->load(['ciclos', 'professores']);

        return response()->json(new DisciplinaResource($disciplina), 200);
    }

    /**
     * Atualiza os dados cadastrais, pedagógicos e os vínculos de Ciclos da disciplina.
     */
    public function update(UpdateDisciplinaRequest $request, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $disciplina);

        $validated = $request->validated();

        $aulasSemanais = $validated['aulas_semanais']
            ?? (isset($validated['carga_horaria_anual']) ? max(1, (int) round($validated['carga_horaria_anual'] / 40)) : $disciplina->aulas_semanais);

        $cargaAnual = $validated['carga_horaria_anual']
            ?? ($aulasSemanais * 40);

        $dadosAtualizacao = [
            'nome' => $validated['nome'] ?? $disciplina->nome,
            'aulas_semanais' => $aulasSemanais,
            'carga_horaria_anual' => $cargaAnual,
            'descricao' => array_key_exists('descricao', $validated) ? $validated['descricao'] : $disciplina->descricao,
            'ementa' => array_key_exists('ementa', $validated) ? $validated['ementa'] : $disciplina->ementa,
            'habilidades_bncc' => array_key_exists('habilidades_bncc', $validated) ? $validated['habilidades_bncc'] : $disciplina->habilidades_bncc,
            'objetivo_geral' => array_key_exists('objetivo_geral', $validated) ? $validated['objetivo_geral'] : $disciplina->objetivo_geral,
            'objetivo_especifico' => array_key_exists('objetivo_especifico', $validated) ? $validated['objetivo_especifico'] : $disciplina->objetivo_especifico,
        ];

        $disciplina->update($dadosAtualizacao);

        // Atualiza os Ciclos caso 'ciclo_ids' ou 'novo_ciclo_nome' tenham sido enviados
        if (array_key_exists('ciclo_ids', $validated) || ! empty($validated['novo_ciclo_nome'])) {
            $cicloIds = array_key_exists('ciclo_ids', $validated)
                ? collect($validated['ciclo_ids'] ?? [])->map(fn ($id) => (int) $id)->all()
                : $disciplina->ciclos()->pluck('ciclos.id_ciclo')->all();

            if (! empty($validated['novo_ciclo_nome'])) {
                $novoCiclo = Ciclo::firstOrCreate([
                    'nome' => trim($validated['novo_ciclo_nome']),
                ]);
                $cicloIds[] = $novoCiclo->id_ciclo;
            }

            $disciplina->ciclos()->sync(array_values(array_unique($cicloIds)));
        }

        if (array_key_exists('professor_ids', $validated)) {
            $disciplina->professores()->sync($validated['professor_ids'] ?? []);
        }

        // Sincroniza a herança com as turmas dos ciclos vinculados
        $disciplina->sincronizarComTurmasDosCiclos();
        $disciplina->load(['ciclos', 'professores']);

        return response()->json(new DisciplinaResource($disciplina), 200);
    }

    /**
     * Exclui uma disciplina do catálogo.
     *
     * @return JsonResponse Retorno HTTP 204
     */
    public function destroy(Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('delete', $disciplina);

        $disciplina->delete();

        return response()->json(null, 204);
    }

    /**
     * Vincula o professor responsável por lecionar uma disciplina em determinada turma.
     */
    public function vincularProfessor(Request $request, Disciplina $disciplina): JsonResponse
    {
        Gate::authorize('update', $disciplina);

        $validated = $request->validate([
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'professor_id' => ['required', 'exists:users,id'],
        ]);

        $vinculo = TurmaDisciplina::updateOrCreate(
            [
                'turma_id' => $validated['turma_id'],
                'disciplina_id' => $disciplina->id_disciplina,
            ],
            [
                'professor_id' => $validated['professor_id'],
            ]
        );

        return response()->json($vinculo->load(['turma', 'disciplina', 'professor:id,name,email']), 200);
    }
}
