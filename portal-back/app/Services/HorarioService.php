<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Horario;
use App\Models\HorarioAula;
use App\Models\Turma;
use App\Models\Turno;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class HorarioService
{
    private const DISCIPLINAS_ANUAIS = [
        'geografia' => 40,
        'filosofia' => 40,
        'artes' => 40,
        'sociologia' => 40,
        'educacao fisica' => 40,
        'ingles' => 40,
        'biologia' => 40,
        'educacao digital' => 40,
        'quimica' => 80,
        'fisica' => 80,
        'historia' => 80,
        'sustentabilidade' => 120,
        'producao cultural' => 120,
        'portugues' => 200,
        'matematica' => 200,
    ];

    private const NOMES_ALTERNATIVOS = [
        'educacaofisica' => 'educacao fisica',
        'educacaodigital' => 'educacao digital',
        'producaocultural' => 'producao cultural',
        'lingua portuguesa' => 'portugues',
        'lingua portuguesa e literatura' => 'portugues',
        'historia geral e do brasil' => 'historia',
    ];

    /**
     * Lista somente turmas que o perfil pode consultar, incluindo as ainda sem horário.
     *
     * @return Collection<int, Turma>
     */
    public function turmasVisiveis(User $user): Collection
    {
        $query = Turma::query();

        if ($this->podeGerenciar($user)) {
            // Gestores precisam encontrar também turmas que ainda não têm grade.
        } elseif ($user->isProfessor()) {
            $query->whereHas('turmaDisciplinas', fn (Builder $builder) => $builder
                ->where('professor_id', $user->id));
        } elseif ($user->role === UserRole::ALUNO) {
            $turmaAtiva = $user->turma_ativa;
            $query->where('id_turma', $turmaAtiva?->id_turma ?? 0);
        } else {
            abort(403, 'Seu perfil não tem acesso aos horários escolares.');
        }

        return $query
            ->with([
                'ciclo.disciplinas',
                'turmaDisciplinas.disciplina',
                'turmaDisciplinas.professor',
                'horarios' => fn (Relation $builder) => $builder
                    ->with(['aulas.disciplina', 'aulas.professor']),
            ])
            ->orderBy('nome_identificador')
            ->get();
    }

    public function gerar(Turma $turma): Horario
    {
        // Reconcilia e limpa vínculos órfãos da turma com seu Ciclo antes da transação,
        // garantindo que a limpeza persista mesmo que ainda faltem professores em algumas matérias.
        $turma->herdarDisciplinasDoCiclo();

        return DB::transaction(function () use ($turma): Horario {
            // O bloqueio por ano impede duas grades simultâneas de reservar o mesmo professor.
            Turma::query()
                ->where('ano_letivo', $turma->ano_letivo)
                ->orderBy('id_turma')
                ->lockForUpdate()
                ->get(['id_turma']);

            // Sincroniza disciplinas e professores herdados do Ciclo Escolar antes de validar a grade
            $turma->herdarDisciplinasDoCiclo();

            $turma->load(['turmaDisciplinas.disciplina', 'turmaDisciplinas.professor']);
            $atribuicoes = $this->validarCurriculo($turma);
            $maxAulasPorDia = $this->calcularMaxAulasPorDia($turma, $atribuicoes);
            $usoExistente = $this->usoDeOutrasTurmas($turma->ano_letivo, $turma->id_turma, $turma);
            $grade = $this->buscarGrade($atribuicoes, $usoExistente['ocupacoes'], $usoExistente['cargas_diarias'], $maxAulasPorDia);

            if ($grade === null) {
                throw ValidationException::withMessages([
                    'horario' => 'Não foi possível montar uma grade válida com os professores e horários já cadastrados. Revise os vínculos ou os horários das outras turmas.',
                ]);
            }

            // A transação publica todas as posições de uma vez e preserva a grade antiga em falhas.
            $horario = Horario::query()->firstOrNew([
                'turma_id' => $turma->id_turma,
                'ano_letivo' => $turma->ano_letivo,
            ]);
            $horario->status = 'em_montagem';
            $horario->save();
            $horario->aulas()->delete();

            foreach ($grade as $aula) {
                $horario->aulas()->create($aula);
            }

            $horario->update(['status' => 'concluido']);

            return $horario->load(['aulas.disciplina', 'aulas.professor']);
        });
    }

    /**
     * Gera os horários escolares simultaneamente para todas as turmas de um Turno específico.
     * Garante que não haja choques de professores entre as turmas do mesmo turno.
     *
     * @return Collection<int, Horario>
     */
    public function gerarPorTurno(string $turno, int $anoLetivo): Collection
    {
        $turmas = Turma::query()
            ->where('ano_letivo', $anoLetivo)
            ->where('status', 'Ativa')
            ->where('turno', $turno)
            ->get();

        if ($turmas->isEmpty()) {
            throw ValidationException::withMessages([
                'turno' => "Nenhuma turma ativa encontrada para o turno '{$turno}' no ano letivo {$anoLetivo}.",
            ]);
        }

        return $this->gerarMultiplas($turmas, $anoLetivo);
    }

    /**
     * Gera os horários escolares para todas as turmas ativas da escola no ano letivo.
     * Processa cada turno em conjunto e sincroniza as cargas diárias globais dos docentes.
     *
     * @return Collection<int, Horario>
     */
    public function gerarTodas(int $anoLetivo): Collection
    {
        $turmas = Turma::query()
            ->where('ano_letivo', $anoLetivo)
            ->where('status', 'Ativa')
            ->get();

        if ($turmas->isEmpty()) {
            throw ValidationException::withMessages([
                'ano_letivo' => "Nenhuma turma ativa cadastrada no ano letivo {$anoLetivo}.",
            ]);
        }

        return $this->gerarMultiplas($turmas, $anoLetivo);
    }

    /**
     * Motor de geração simultânea multi-turma com resolução de restrições por retrocesso (backtracking).
     *
     * @param  Collection<int, Turma>|array<int, Turma>  $turmas
     * @return Collection<int, Horario>
     */
    public function gerarMultiplas(Collection|array $turmas, int $anoLetivo): Collection
    {
        $turmasColecao = $turmas instanceof Collection ? $turmas : collect($turmas);

        if ($turmasColecao->isEmpty()) {
            return new Collection;
        }

        return DB::transaction(function () use ($turmasColecao, $anoLetivo): Collection {
            // O bloqueio impede geração concorrente sobre as mesmas turmas
            Turma::query()
                ->where('ano_letivo', $anoLetivo)
                ->orderBy('id_turma')
                ->lockForUpdate()
                ->get(['id_turma']);

            $turmasIds = $turmasColecao->pluck('id_turma')->all();
            $usoExistente = $this->usoDeOutrasTurmas($anoLetivo, $turmasIds);

            // 1. Sincroniza vínculos do Ciclo e valida o currículo de cada turma do lote
            $turmasDados = [];
            foreach ($turmasColecao as $turma) {
                $turma->herdarDisciplinasDoCiclo();
                $turma->load(['turmaDisciplinas.disciplina', 'turmaDisciplinas.professor']);
                $atribuicoes = $this->validarCurriculo($turma);

                $turmasDados[] = [
                    'turma' => $turma,
                    'atribuicoes' => $atribuicoes,
                    'total_aulas' => array_sum(array_column($atribuicoes, 'aulas_semanais')),
                    'max_aulas_dia' => $this->calcularMaxAulasPorDia($turma, $atribuicoes),
                ];
            }

            // 2. Ordena as turmas colocando primeiro as mais restritas (maior número de aulas)
            usort($turmasDados, fn ($a, $b) => $b['total_aulas'] <=> $a['total_aulas']);

            // Mapeia previamente os horários de início e término de cada turma do lote para checagem rápida de choques
            $turnosCache = Turno::all()->keyBy(fn ($t) => strtolower($t->id));
            $horariosPorTurmaId = [];
            foreach ($turmasColecao as $t) {
                $horariosPorTurmaId[$t->id_turma] = $this->mapearHorariosTurno($t->turno, $turnosCache);
            }

            // 3. Executa a resolução multi-turma com backtracking
            $gradesPorTurma = $this->resolverGradesMultiplas(
                $turmasDados,
                0,
                $usoExistente['ocupacoes'],
                $usoExistente['cargas_diarias'],
                $horariosPorTurmaId
            );

            if ($gradesPorTurma === null) {
                throw ValidationException::withMessages([
                    'horario' => 'Não foi possível encontrar uma grade válida sem conflito de professores entre as turmas selecionadas. Revise a alocação docente e a disponibilidade dos professores.',
                ]);
            }

            // 4. Persiste atomicamente as grades geradas para todas as turmas
            $horariosSalvos = new Collection;
            foreach ($gradesPorTurma as $turmaId => $gradeAulas) {
                $horario = Horario::query()->firstOrNew([
                    'turma_id' => $turmaId,
                    'ano_letivo' => $anoLetivo,
                ]);
                $horario->status = 'em_montagem';
                $horario->save();
                $horario->aulas()->delete();

                foreach ($gradeAulas as $aula) {
                    $horario->aulas()->create($aula);
                }

                $horario->update(['status' => 'concluido']);
                $horariosSalvos->push($horario->load(['aulas.disciplina', 'aulas.professor']));
            }

            return $horariosSalvos;
        });
    }

    /**
     * Resolução recursiva com retrocesso entre turmas para garantir que escolhas de uma turma
     * não impeçam as turmas subsequentes de encontrar horários válidos.
     *
     * @param  array<int, array{turma: Turma, atribuicoes: array, total_aulas: int, max_aulas_dia: int}>  $turmasLista
     * @param  array<int, array<int, array<int, bool>>>  $ocupacoes
     * @param  array<int, array<int, int>>  $cargasDiarias
     * @param  array<int, array<int, array{inicio: string, fim: string}>>  $horariosPorTurmaId
     * @return array<int, array>|null
     */
    private function resolverGradesMultiplas(
        array $turmasLista,
        int $indice,
        array $ocupacoes,
        array $cargasDiarias,
        array $horariosPorTurmaId = []
    ): ?array {
        if ($indice >= count($turmasLista)) {
            return [];
        }

        $itemAtual = $turmasLista[$indice];
        $turma = $itemAtual['turma'];
        $atribuicoes = $itemAtual['atribuicoes'];
        $maxAulasPorDia = $itemAtual['max_aulas_dia'] ?? 6;
        $horariosTurmaAtual = $horariosPorTurmaId[$turma->id_turma] ?? [];

        // Tenta até 6 variações de grade para a turma atual
        $maxTentativas = 6;
        for ($t = 0; $t < $maxTentativas; $t++) {
            $grade = $this->buscarGrade($atribuicoes, $ocupacoes, $cargasDiarias, $maxAulasPorDia);
            if ($grade === null) {
                return null;
            }

            $novasOcupacoes = $ocupacoes;
            $novasCargas = $cargasDiarias;

            foreach ($grade as $aula) {
                $profId = (int) $aula['professor_id'];
                $dia = (int) $aula['dia_semana'];
                $periodo = (int) $aula['aula_numero'];
                $novasCargas[$profId][$dia] = ($novasCargas[$profId][$dia] ?? 0) + 1;

                // Propaga a ocupação para as próximas turmas
                $faixaAula = $horariosTurmaAtual[$periodo] ?? null;
                $proximaTurma = $turmasLista[$indice + 1]['turma'] ?? null;
                $horariosProxima = $proximaTurma ? ($horariosPorTurmaId[$proximaTurma->id_turma] ?? []) : [];

                if ($faixaAula && ! empty($horariosProxima)) {
                    foreach ($horariosProxima as $periodoProx => $faixaProx) {
                        if ($this->horariosColidem($faixaProx, $faixaAula)) {
                            $novasOcupacoes[$profId][$dia][$periodoProx] = true;
                        }
                    }
                } else {
                    $novasOcupacoes[$profId][$dia][$periodo] = true;
                }
            }

            $restoGrades = $this->resolverGradesMultiplas(
                $turmasLista,
                $indice + 1,
                $novasOcupacoes,
                $novasCargas,
                $horariosPorTurmaId
            );

            if ($restoGrades !== null) {
                return [$turma->id_turma => $grade] + $restoGrades;
            }
        }

        return null;
    }

    /**
     * Move uma aula trocando-a com a posição ocupada e valida o resultado completo.
     *
     * @param  array{destino_dia_semana: int, destino_aula_numero: int}  $destino
     */
    public function mover(Horario $horario, HorarioAula $aula, array $destino): Horario
    {
        return DB::transaction(function () use ($horario, $aula, $destino): Horario {
            Turma::query()
                ->where('ano_letivo', $horario->ano_letivo)
                ->orderBy('id_turma')
                ->lockForUpdate()
                ->get(['id_turma']);

            $horario = Horario::query()->whereKey($horario->id)->lockForUpdate()->firstOrFail();
            $aula = HorarioAula::query()
                ->where('horario_id', $horario->id)
                ->whereKey($aula->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($horario->status !== 'concluido') {
                throw ValidationException::withMessages([
                    'horario' => 'Somente horários concluídos podem ser editados.',
                ]);
            }

            $origem = [
                'dia_semana' => $aula->dia_semana,
                'aula_numero' => $aula->aula_numero,
            ];
            $diaDestino = $destino['destino_dia_semana'];
            $periodoDestino = $destino['destino_aula_numero'];

            if ($origem['dia_semana'] === $diaDestino && $origem['aula_numero'] === $periodoDestino) {
                return $horario->load(['aulas.disciplina', 'aulas.professor']);
            }

            $aulaDestino = HorarioAula::query()
                ->where('horario_id', $horario->id)
                ->where('dia_semana', $diaDestino)
                ->where('aula_numero', $periodoDestino)
                ->lockForUpdate()
                ->first();

            if ($aulaDestino === null) {
                if ($horario->turma?->ciclo_id === null) {
                    throw ValidationException::withMessages([
                        'destino_aula_numero' => 'A grade concluída está incompleta; atualize o horário antes de editá-lo.',
                    ]);
                }

                // Em grades vinculadas a um Ciclo Escolar com menos de 30 aulas, permite mover para um período vago
                $aula->update([
                    'dia_semana' => $diaDestino,
                    'aula_numero' => $periodoDestino,
                ]);
            } else {
                // Uma posição temporária permite trocar duas aulas sem violar a chave única do período.
                $aula->update([
                    'dia_semana' => 0,
                    'aula_numero' => 0,
                ]);
                $aulaDestino->update($origem);
                $aula->update([
                    'dia_semana' => $diaDestino,
                    'aula_numero' => $periodoDestino,
                ]);
            }

            $gradeAtualizada = $horario->aulas()->get();
            $usoExistente = $this->usoDeOutrasTurmas($horario->ano_letivo, $horario->turma_id, $horario->turma);
            $this->validarGradeEditada($gradeAtualizada, $usoExistente);

            return $horario->load(['aulas.disciplina', 'aulas.professor']);
        });
    }

    private function podeGerenciar(User $user): bool
    {
        return $user->isAdm() || $user->isEspecialista();
    }

    /**
     * Confere as disciplinas vinculadas à turma (ou herdadas do Ciclo), suas aulas semanais
     * (calculadas sobre 40 semanas letivas) e o professor responsável (Itens 3.3 e 3.4c).
     *
     * @return array<string, array{professor_id: int, aulas_semanais: int, disciplina_id: int}>
     */
    private function validarCurriculo(Turma $turma): array
    {
        $atribuicoes = [];
        $erros = [];

        $disciplinasPermitidasIds = null;
        if ($turma->ciclo_id !== null) {
            $idsDoCiclo = $turma->ciclo()
                ->with('disciplinas:id_disciplina')
                ->first()
                ?->disciplinas
                ?->pluck('id_disciplina')
                ?->map(fn ($id) => (int) $id)
                ?->all() ?? [];

            if (! empty($idsDoCiclo)) {
                $disciplinasPermitidasIds = array_flip($idsDoCiclo);
            }
        }

        foreach ($turma->turmaDisciplinas as $vinculo) {
            $disciplina = $vinculo->disciplina;
            if (! $disciplina) {
                continue;
            }

            if ($disciplinasPermitidasIds !== null && ! isset($disciplinasPermitidasIds[(int) $disciplina->id_disciplina])) {
                continue;
            }

            $nome = $this->normalizarNome($disciplina->nome);
            $chave = self::NOMES_ALTERNATIVOS[$nome] ?? $nome ?: 'disc_'.$disciplina->id_disciplina;

            if (isset($atribuicoes[$chave])) {
                $erros[] = "A disciplina {$disciplina->nome} está vinculada mais de uma vez à turma.";

                continue;
            }

            // Aulas semanais vindas diretamente do cadastro da disciplina (ou derivadas de 40 semanas letivas)
            $aulasSemanais = (int) ($disciplina->aulas_semanais ?: intdiv(max(40, (int) $disciplina->carga_horaria_anual), 40));

            // Tenta recuperar o professor titular da disciplina caso a alocação da turma esteja sem professor
            $professor = $vinculo->professor;
            if ($professor === null) {
                $professorTitular = $disciplina->professores()->first();
                if ($professorTitular) {
                    $vinculo->update(['professor_id' => $professorTitular->id]);
                    $professor = $professorTitular;
                }
            }

            if ($professor === null || ! $professor->isProfessor()) {
                $erros[] = "Vincule um professor válido à disciplina {$disciplina->nome}.";
            }

            $atribuicoes[$chave] = [
                'professor_id' => (int) ($professor?->id ?? $vinculo->professor_id),
                'aulas_semanais' => $aulasSemanais,
                'disciplina_id' => (int) $disciplina->id_disciplina,
            ];
        }

        if ($atribuicoes === []) {
            $erros[] = 'Nenhuma disciplina vinculada à turma ou ao seu Ciclo Escolar.';
        }

        // Obtém os parâmetros operacionais dinâmicos do turno configurado
        $turno = (new Turno)->resolveRouteBinding($turma->turno);
        $aulasPorDiaTurno = 0;
        if ($turno) {
            $gradeTurno = $turno->obterGradeHorarios();
            $aulasNoTurno = count(array_filter($gradeTurno, fn ($i) => empty($i['is_intervalo'])));
            $aulasPorDiaTurno = $aulasNoTurno > 0 ? $aulasNoTurno : (int) $turno->quantidade_aulas;
        }

        $aulasPorDiaTurno = $aulasPorDiaTurno > 0 ? $aulasPorDiaTurno : 6;
        $capacidadeSemanalTurno = $aulasPorDiaTurno * 5; // 5 dias letivos por semana (segunda a sexta)
        $nomeTurno = $turno?->nome ?? ($turma->turno ?: 'Turno Padrão');

        // Valida se alguma disciplina excede a capacidade semanal total do turno
        foreach ($atribuicoes as $atrib) {
            if ($atrib['aulas_semanais'] < 1 || $atrib['aulas_semanais'] > $capacidadeSemanalTurno) {
                $erros[] = "A carga horária semanal ({$atrib['aulas_semanais']} aulas) excede o limite do turno {$nomeTurno} ({$capacidadeSemanalTurno} aulas semanais).";
            }
        }

        $totalAulas = array_sum(array_column($atribuicoes, 'aulas_semanais'));

        // Se a turma está vinculada a um Ciclo Escolar dinâmico, confere contra a capacidade semanal real do turno configurado
        if ($turma->ciclo_id !== null) {
            if ($totalAulas < 1) {
                $erros[] = 'A grade curricular do ciclo não possui aulas semanais vinculadas.';
            } elseif ($totalAulas > $capacidadeSemanalTurno) {
                $erros[] = "A soma de aulas semanais do ciclo ({$totalAulas} aulas) excede a capacidade máxima do turno {$nomeTurno} ({$capacidadeSemanalTurno} aulas semanais: {$aulasPorDiaTurno} aulas/dia × 5 dias). Ajuste as cargas horárias do ciclo ou configure o turno correspondente.";
            }
        } elseif ($totalAulas !== 30) {
            // Modo legado (turma sem ciclo): exige a grade padrão de 30 aulas semanais
            $erros[] = "A carga horária semanal deve totalizar 30 aulas; a configuração atual totaliza {$totalAulas}.";
        }

        if ($erros !== []) {
            throw ValidationException::withMessages(['curriculo' => $erros]);
        }

        return $atribuicoes;
    }

    private function normalizarNome(string $nome): string
    {
        return Str::of($nome)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->trim()
            ->toString();
    }

    /**
     * Calcula o número máximo de aulas/períodos diários para alocação da turma,
     * respeitando a configuração do turno ou a demanda semanal do currículo.
     *
     * @param  array<string, array{professor_id: int, aulas_semanais: int, disciplina_id: int}>  $atribuicoes
     */
    private function calcularMaxAulasPorDia(Turma $turma, array $atribuicoes): int
    {
        $turno = (new Turno)->resolveRouteBinding($turma->turno);

        $totalAulas = array_sum(array_column($atribuicoes, 'aulas_semanais'));
        $aulasPorDiaMinimas = (int) ceil($totalAulas / 5);

        $aulasPorDiaTurno = 0;
        if ($turno) {
            $gradeTurno = $turno->obterGradeHorarios();
            $aulasNoTurno = count(array_filter($gradeTurno, fn ($i) => empty($i['is_intervalo'])));
            $aulasPorDiaTurno = $aulasNoTurno > 0 ? $aulasNoTurno : (int) $turno->quantidade_aulas;
        }

        if ($aulasPorDiaTurno > 0) {
            return max($aulasPorDiaTurno, $aulasPorDiaMinimas);
        }

        return max(6, $aulasPorDiaMinimas);
    }

    /**
     * Mapeia os horários de início e término de cada aula de um turno.
     *
     * @param  Collection<string, Turno>  $turnosCache
     * @return array<int, array{inicio: string, fim: string}>
     */
    private function mapearHorariosTurno(?string $turnoNome, Collection $turnosCache): array
    {
        if (! $turnoNome) {
            return [];
        }

        $turno = $turnosCache->get(strtolower($turnoNome));
        if (! $turno) {
            return [];
        }

        $grade = $turno->obterGradeHorarios();
        $mapa = [];
        foreach ($grade as $item) {
            if (! empty($item['is_intervalo'])) {
                continue;
            }
            $periodo = (int) ($item['periodo'] ?? $item['aula_numero'] ?? 0);
            if ($periodo > 0 && ! empty($item['hora_inicio']) && ! empty($item['hora_fim'])) {
                $mapa[$periodo] = [
                    'inicio' => $item['hora_inicio'],
                    'fim' => $item['hora_fim'],
                ];
            }
        }

        return $mapa;
    }

    /**
     * Verifica se duas faixas horárias se sobrepõem cronologicamente no mesmo dia.
     *
     * @param  array{inicio: string, fim: string}  $faixa1
     * @param  array{inicio: string, fim: string}  $faixa2
     */
    private function horariosColidem(array $faixa1, array $faixa2): bool
    {
        return max($faixa1['inicio'], $faixa2['inicio']) < min($faixa1['fim'], $faixa2['fim']);
    }

    /**
     * Identifica as ocupações e cargas diárias de professores já alocados em outras turmas.
     * Leva em consideração os horários operacionais reais de cada turno para evitar falsos choques.
     *
     * @param  int|array<int>  $turmasExcluidas
     * @return array{
     *     ocupacoes: array<int, array<int, array<int, bool>>>,
     *     cargas_diarias: array<int, array<int, int>>
     * }
     */
    private function usoDeOutrasTurmas(int $anoLetivo, int|array $turmasExcluidas, ?Turma $turmaAlvo = null): array
    {
        $idsExcluir = is_array($turmasExcluidas) ? $turmasExcluidas : [$turmasExcluidas];

        $ocupacoes = [];
        $cargasDiarias = [];
        $horarios = Horario::query()
            ->where('ano_letivo', $anoLetivo)
            ->whereNotIn('turma_id', $idsExcluir)
            ->where('status', 'concluido')
            ->with(['aulas', 'turma'])
            ->lockForUpdate()
            ->get();

        $turnosCache = Turno::all()->keyBy(fn ($t) => strtolower($t->id));
        $horariosAlvo = $turmaAlvo ? $this->mapearHorariosTurno($turmaAlvo->turno, $turnosCache) : [];

        foreach ($horarios as $horario) {
            $turnoOrigem = $horario->turma?->turno;
            $horariosOrigem = $this->mapearHorariosTurno($turnoOrigem, $turnosCache);

            foreach ($horario->aulas as $aula) {
                $professorId = (int) $aula->professor_id;
                $dia = (int) $aula->dia_semana;
                $periodoOrigem = (int) $aula->aula_numero;
                $cargasDiarias[$professorId][$dia] = ($cargasDiarias[$professorId][$dia] ?? 0) + 1;

                // Se temos informações de horários reais para ambas as turmas, compara faixas de tempo
                if (! empty($horariosAlvo) && isset($horariosOrigem[$periodoOrigem])) {
                    $faixaOrigem = $horariosOrigem[$periodoOrigem];
                    foreach ($horariosAlvo as $periodoAlvo => $faixaAlvo) {
                        if ($this->horariosColidem($faixaAlvo, $faixaOrigem)) {
                            $ocupacoes[$professorId][$dia][$periodoAlvo] = true;
                        }
                    }
                } else {
                    // Fallback para quando uma ou ambas as turmas não possuem turno configurado
                    $ocupacoes[$professorId][$dia][$periodoOrigem] = true;
                }
            }
        }

        return ['ocupacoes' => $ocupacoes, 'cargas_diarias' => $cargasDiarias];
    }

    /**
     * Busca uma combinação válida, priorizando concentrar aulas de cada professor no mesmo dia.
     *
     * @param  array<string, array{professor_id: int, aulas_semanais: int, disciplina_id: int}>  $atribuicoes
     * @param  array<int, array<int, array<int, bool>>>  $ocupacoes
     * @param  array<int, array<int, int>>  $cargasDiarias
     * @return array<int, array{dia_semana: int, aula_numero: int, disciplina_id: int, professor_id: int}>|null
     */
    private function buscarGrade(array $atribuicoes, array $ocupacoes, array $cargasDiarias, int $maxAulasPorDia = 6): ?array
    {
        $restantes = [];
        $porDisciplina = [];

        foreach ($atribuicoes as $atribuicao) {
            $id = $atribuicao['disciplina_id'];
            $restantes[$id] = $atribuicao['aulas_semanais'];
            $porDisciplina[$id] = $atribuicao;
        }

        $aulasPorProfessor = [];
        foreach ($atribuicoes as $atribuicao) {
            $id = $atribuicao['professor_id'];
            $aulasPorProfessor[$id] = ($aulasPorProfessor[$id] ?? 0) + $atribuicao['aulas_semanais'];
        }

        foreach ($aulasPorProfessor as $professorId => $aulas) {
            $aulasExistentes = array_sum($cargasDiarias[$professorId] ?? []);
            if ($aulasExistentes + $aulas > 40) {
                return null;
            }
        }

        $posicoes = [];
        for ($dia = 1; $dia <= 5; $dia++) {
            for ($periodo = 1; $periodo <= $maxAulasPorDia; $periodo++) {
                $professoresDisponiveis = [];
                foreach ($porDisciplina as $atribuicao) {
                    $professorId = $atribuicao['professor_id'];
                    if (! ($ocupacoes[$professorId][$dia][$periodo] ?? false)
                        && ($cargasDiarias[$professorId][$dia] ?? 0) < 6) {
                        $professoresDisponiveis[$professorId] = true;
                    }
                }

                $posicoes[] = [
                    'dia' => $dia,
                    'periodo' => $periodo,
                    'opcoes' => count($professoresDisponiveis),
                    'ordem_aleatoria' => random_int(0, PHP_INT_MAX),
                ];
            }
        }

        // Fixar uma ordem das posições reduz permutações equivalentes na busca com retrocesso.
        usort($posicoes, static fn (array $first, array $second): int => (
            $first['opcoes'] <=> $second['opcoes']
            ?: $first['ordem_aleatoria'] <=> $second['ordem_aleatoria']
        ));

        $grade = $this->buscarPosicoes($posicoes, 0, $restantes, $porDisciplina, [], $ocupacoes, $cargasDiarias);
        if ($grade === null) {
            return null;
        }

        $resultado = [];
        foreach ($grade as $chave => $aula) {
            [$dia, $periodo] = array_map('intval', explode('-', $chave));
            $resultado[] = [
                'dia_semana' => $dia,
                'aula_numero' => $periodo,
                'disciplina_id' => $aula['disciplina_id'],
                'professor_id' => $aula['professor_id'],
            ];
        }

        return $resultado;
    }

    /**
     * @param  array<int, int>  $restantes
     * @param  array<int, array{professor_id: int, aulas_semanais: int, disciplina_id: int}>  $porDisciplina
     * @param  array<string, array{disciplina_id: int, professor_id: int}>  $grade
     * @param  array<int, array<int, array<int, bool>>>  $ocupacoes
     * @param  array<int, array<int, int>>  $cargasDiarias
     * @return array<string, array{disciplina_id: int, professor_id: int}>|null
     */
    private function buscarPosicoes(
        array $posicoes,
        int $indice,
        array $restantes,
        array $porDisciplina,
        array $grade,
        array $ocupacoes,
        array $cargasDiarias
    ): ?array {
        if (array_sum($restantes) === 0) {
            return $grade;
        }

        $posicao = $posicoes[$indice] ?? null;
        if ($posicao === null) {
            return null;
        }

        $dia = $posicao['dia'];
        $periodo = $posicao['periodo'];
        $chave = "{$dia}-{$periodo}";
        $opcoes = [];

        foreach ($restantes as $disciplinaId => $quantidade) {
            if ($quantidade < 1) {
                continue;
            }

            $professorId = $porDisciplina[$disciplinaId]['professor_id'];
            if (($ocupacoes[$professorId][$dia][$periodo] ?? false)
                || ($cargasDiarias[$professorId][$dia] ?? 0) >= 5
                || $this->criaTresAulasSeguidas($grade, $dia, $periodo, $professorId)) {
                continue;
            }

            $opcoes[] = [
                'disciplina_id' => $disciplinaId,
                'professor_id' => $professorId,
                'prioridade' => ($cargasDiarias[$professorId][$dia] ?? 0) * 100
                    - $this->aulasAdjacentesDoProfessor($grade, $dia, $periodo, $professorId) * 10
                    + random_int(0, 9),
            ];
        }

        $vagasSobrando = (count($posicoes) - $indice) - array_sum($restantes);

        if ($opcoes === []) {
            // Se nenhuma disciplina pode entrar neste período, mas ainda há posições sobressalentes,
            // deixa este período vago e continua a busca nas próximas posições
            if ($vagasSobrando > 0) {
                return $this->buscarPosicoes(
                    $posicoes,
                    $indice + 1,
                    $restantes,
                    $porDisciplina,
                    $grade,
                    $ocupacoes,
                    $cargasDiarias
                );
            }

            return null;
        }

        usort($opcoes, static fn (array $first, array $second): int => $second['prioridade'] <=> $first['prioridade']);

        foreach ($opcoes as $opcao) {
            $gradeAtualizada = $grade;
            $gradeAtualizada[$chave] = [
                'disciplina_id' => $opcao['disciplina_id'],
                'professor_id' => $opcao['professor_id'],
            ];
            $restantesAtualizados = $restantes;
            $restantesAtualizados[$opcao['disciplina_id']]--;
            $cargasAtualizadas = $cargasDiarias;
            $cargasAtualizadas[$opcao['professor_id']][$dia] = ($cargasAtualizadas[$opcao['professor_id']][$dia] ?? 0) + 1;

            $resultado = $this->buscarPosicoes(
                $posicoes,
                $indice + 1,
                $restantesAtualizados,
                $porDisciplina,
                $gradeAtualizada,
                $ocupacoes,
                $cargasAtualizadas
            );
            if ($resultado !== null) {
                return $resultado;
            }
        }

        // Se nenhuma das opções de preenchimento produziu solução viável, tenta manter esta posição vaga caso haja vagas sobressalentes
        if ($vagasSobrando > 0) {
            $resultadoVago = $this->buscarPosicoes(
                $posicoes,
                $indice + 1,
                $restantes,
                $porDisciplina,
                $grade,
                $ocupacoes,
                $cargasDiarias
            );
            if ($resultadoVago !== null) {
                return $resultadoVago;
            }
        }

        return null;
    }

    /**
     * @param  array<string, array{disciplina_id: int, professor_id: int}>  $grade
     */
    private function criaTresAulasSeguidas(array $grade, int $dia, int $periodo, int $professorId): bool
    {
        $inicio = max(1, $periodo - 2);
        $fim = $periodo;

        for ($primeiro = $inicio; $primeiro <= $fim; $primeiro++) {
            $quantidade = 0;
            for ($posicao = $primeiro; $posicao < $primeiro + 3; $posicao++) {
                $aula = $grade["{$dia}-{$posicao}"] ?? null;
                if (($aula['professor_id'] ?? null) === $professorId || $posicao === $periodo) {
                    $quantidade++;
                }
            }

            if ($quantidade === 3) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, array{disciplina_id: int, professor_id: int}>  $grade
     */
    private function aulasAdjacentesDoProfessor(array $grade, int $dia, int $periodo, int $professorId): int
    {
        $quantidade = 0;
        foreach ([$periodo - 1, $periodo + 1] as $vizinho) {
            if (($grade["{$dia}-{$vizinho}"]['professor_id'] ?? null) === $professorId) {
                $quantidade++;
            }
        }

        return $quantidade;
    }

    /**
     * @param  Collection<int, HorarioAula>  $grade
     * @param  array{ocupacoes: array<int, array<int, array<int, bool>>>, cargas_diarias: array<int, array<int, int>>}  $usoExistente
     */
    private function validarGradeEditada(Collection $grade, array $usoExistente): void
    {
        $cargasDiarias = $usoExistente['cargas_diarias'];
        $professoresPorTurmaEDia = [];
        $ocupacoes = $usoExistente['ocupacoes'];

        foreach ($grade as $aula) {
            $professorId = (int) $aula->professor_id;
            $dia = (int) $aula->dia_semana;
            $periodo = (int) $aula->aula_numero;

            if (isset($ocupacoes[$professorId][$dia][$periodo])) {
                throw ValidationException::withMessages([
                    'horario' => 'Este professor já está em aula em outra turma nesse período.',
                ]);
            }

            $ocupacoes[$professorId][$dia][$periodo] = true;
            $cargasDiarias[$professorId][$dia] = ($cargasDiarias[$professorId][$dia] ?? 0) + 1;
            $professoresPorTurmaEDia[$dia][$periodo] = $professorId;

            if ($cargasDiarias[$professorId][$dia] > 5) {
                throw ValidationException::withMessages([
                    'horario' => 'Um professor não pode ministrar mais de cinco aulas no mesmo dia.',
                ]);
            }
        }

        for ($dia = 1; $dia <= 5; $dia++) {
            $periodosDoDia = array_keys($professoresPorTurmaEDia[$dia] ?? []);
            $maxPeriodoDia = ! empty($periodosDoDia) ? max($periodosDoDia) : 6;
            for ($periodo = 1; $periodo <= $maxPeriodoDia - 2; $periodo++) {
                $professorId = $professoresPorTurmaEDia[$dia][$periodo] ?? null;
                if ($professorId !== null
                    && $professorId === ($professoresPorTurmaEDia[$dia][$periodo + 1] ?? null)
                    && $professorId === ($professoresPorTurmaEDia[$dia][$periodo + 2] ?? null)) {
                    throw ValidationException::withMessages([
                        'horario' => 'O mesmo professor não pode dar três aulas seguidas na mesma turma.',
                    ]);
                }
            }
        }
    }
}
