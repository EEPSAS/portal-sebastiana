<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Horario;
use App\Models\HorarioAula;
use App\Models\Turma;
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
            $usoExistente = $this->usoDeOutrasTurmas($turma->ano_letivo, $turma->id_turma);
            $grade = $this->buscarGrade($atribuicoes, $usoExistente['ocupacoes'], $usoExistente['cargas_diarias']);

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
            $usoExistente = $this->usoDeOutrasTurmas($horario->ano_letivo, $horario->turma_id);
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

        foreach ($turma->turmaDisciplinas as $vinculo) {
            $disciplina = $vinculo->disciplina;
            if (! $disciplina) {
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

            if ($aulasSemanais < 1 || $aulasSemanais > 30) {
                $erros[] = "A disciplina {$disciplina->nome} possui quantidade de aulas semanais inválida ({$aulasSemanais}).";
            }

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

        $totalAulas = array_sum(array_column($atribuicoes, 'aulas_semanais'));

        // Se a turma está vinculada a um Ciclo Escolar dinâmico, permite gerar grade com até 30 aulas semanais;
        // para turmas sem ciclo (modo legado), exige a grade completa de 30 aulas semanais.
        if ($turma->ciclo_id !== null) {
            if ($totalAulas < 1 || $totalAulas > 30) {
                $erros[] = "A soma de aulas semanais do ciclo deve estar entre 1 e 30 aulas; atual: {$totalAulas}.";
            }
        } elseif ($totalAulas !== 30) {
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
     * @return array{
     *     ocupacoes: array<int, array<int, array<int, bool>>>,
     *     cargas_diarias: array<int, array<int, int>>
     * }
     */
    private function usoDeOutrasTurmas(int $anoLetivo, int $turmaId): array
    {
        $ocupacoes = [];
        $cargasDiarias = [];
        $horarios = Horario::query()
            ->where('ano_letivo', $anoLetivo)
            ->where('turma_id', '!=', $turmaId)
            ->where('status', 'concluido')
            ->with('aulas')
            ->lockForUpdate()
            ->get();

        foreach ($horarios as $horario) {
            foreach ($horario->aulas as $aula) {
                $professorId = (int) $aula->professor_id;
                $dia = (int) $aula->dia_semana;
                $periodo = (int) $aula->aula_numero;
                $ocupacoes[$professorId][$dia][$periodo] = true;
                $cargasDiarias[$professorId][$dia] = ($cargasDiarias[$professorId][$dia] ?? 0) + 1;
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
    private function buscarGrade(array $atribuicoes, array $ocupacoes, array $cargasDiarias): ?array
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
            if ($aulasExistentes + $aulas > 25) {
                return null;
            }
        }

        $posicoes = [];
        for ($dia = 1; $dia <= 5; $dia++) {
            for ($periodo = 1; $periodo <= 6; $periodo++) {
                $professoresDisponiveis = [];
                foreach ($porDisciplina as $atribuicao) {
                    $professorId = $atribuicao['professor_id'];
                    if (! ($ocupacoes[$professorId][$dia][$periodo] ?? false)
                        && ($cargasDiarias[$professorId][$dia] ?? 0) < 5) {
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

        if ($opcoes === []) {
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

        return null;
    }

    /**
     * @param  array<string, array{disciplina_id: int, professor_id: int}>  $grade
     */
    private function criaTresAulasSeguidas(array $grade, int $dia, int $periodo, int $professorId): bool
    {
        $inicio = max(1, $periodo - 2);
        $fim = min(4, $periodo);

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
            for ($periodo = 1; $periodo <= 4; $periodo++) {
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
