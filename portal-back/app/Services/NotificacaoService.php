<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use App\Notifications\NotificacaoPortal;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NotificacaoService
{
    /**
     * Persiste uma mensagem por destinatário para manter estados de leitura independentes.
     *
     * @param  array<string, mixed>  $dados
     * @return Collection<int, DatabaseNotification>
     */
    public function criarManual(User $autor, array $dados): Collection
    {
        $destinatarios = $this->resolverDestinatarios($autor, $dados);

        if ($destinatarios->isEmpty()) {
            throw ValidationException::withMessages([
                'destinatario_tipo' => 'Não há estudantes ativos para receber esta notificação.',
            ]);
        }

        $eventKey = 'manual:'.Str::uuid();
        $payload = [
            'titulo' => $dados['titulo'],
            'assunto' => $dados['assunto'],
            'tipo' => 'manual',
            'origem' => 'usuario',
            'prioridade' => ($dados['super_importante'] ?? false) ? 'super_importante' : 'importante',
            'criador_id' => $autor->id,
            'criador_nome' => $autor->name,
            'event_key' => $eventKey,
        ];

        Notification::send($destinatarios, new NotificacaoPortal($payload));

        return $this->buscarNotificacoesDoEvento($destinatarios, $eventKey);
    }

    /**
     * Cria alertas acadêmicos depois que as notas e frequências do CSV foram sincronizadas.
     *
     * @param  array<int, array<string, mixed>>  $alunosDados
     */
    public function notificarImportacaoAcademica(
        Turma $turma,
        array $alunosDados,
        string $periodo,
        string $dataAula
    ): void {
        $alunoIds = collect($alunosDados)->pluck('usuario_id')->unique()->values();
        if ($alunoIds->isEmpty()) {
            return;
        }

        $notas = Nota::query()
            ->where('turma_id', $turma->id_turma)
            ->whereIn('usuario_id', $alunoIds)
            ->get()
            ->keyBy(fn (Nota $nota): string => $this->chaveAcademica(
                $nota->usuario_id,
                $nota->disciplina_id,
                $nota->periodo_letivo
            ));

        $disciplinaIds = collect($alunosDados)
            ->flatMap(fn (array $aluno): array => [
                ...collect($aluno['notas'] ?? [])->pluck('disciplina_id')->all(),
                ...collect($aluno['faltas'] ?? [])->pluck('disciplina_id')->all(),
            ])
            ->unique()
            ->values();

        $disciplinas = Disciplina::query()
            ->whereIn('id_disciplina', $disciplinaIds)
            ->get()
            ->keyBy('id_disciplina');

        $alunos = User::query()
            ->whereIn('id', $alunoIds)
            ->where('ativo', true)
            ->get()
            ->keyBy('id');

        [$inicioPeriodo, $fimPeriodo] = $this->intervaloPeriodo($periodo, $dataAula);
        $frequencias = Frequencia::query()
            ->where('turma_id', $turma->id_turma)
            ->whereIn('usuario_id', $alunoIds)
            ->whereBetween('data_aula', [$inicioPeriodo, $fimPeriodo])
            ->get()
            ->groupBy(fn (Frequencia $frequencia): string => $this->chaveAcademica(
                $frequencia->usuario_id,
                $frequencia->disciplina_id,
                $periodo
            ));

        foreach ($alunosDados as $alunoDados) {
            $aluno = $alunos->get($alunoDados['usuario_id']);
            if (! $aluno || ! $aluno->isAluno()) {
                continue;
            }

            foreach ($alunoDados['notas'] ?? [] as $notaImportada) {
                $periodoNota = $notaImportada['periodo_letivo'] ?? $periodo;
                $nota = $notas->get($this->chaveAcademica(
                    $aluno->id,
                    $notaImportada['disciplina_id'],
                    $periodoNota
                ));
                $disciplina = $disciplinas->get($notaImportada['disciplina_id']);

                if (! $nota || ! $disciplina || $nota->valor_maximo <= 0) {
                    continue;
                }

                $percentual = ((float) $nota->valor_nota / (float) $nota->valor_maximo) * 100;
                $categoria = $percentual < 60 ? 'alerta' : ($percentual >= 80 ? 'destaque' : null);
                if ($categoria === null) {
                    continue;
                }

                $percentualFormatado = number_format($percentual, 1, ',', '.');
                $notaFormatada = number_format((float) $nota->valor_nota, 2, ',', '.');
                $maximoFormatado = number_format((float) $nota->valor_maximo, 2, ',', '.');
                $titulo = $categoria === 'alerta'
                    ? "Atenção à nota em {$disciplina->nome}"
                    : "Bom desempenho em {$disciplina->nome}";
                $assuntoAluno = $categoria === 'alerta'
                    ? "Sua nota foi {$notaFormatada} de {$maximoFormatado} ({$percentualFormatado}%). Consulte seu boletim e converse com a equipe pedagógica."
                    : "Sua nota foi {$notaFormatada} de {$maximoFormatado} ({$percentualFormatado}%). Continue se dedicando!";
                $eventKey = "academico:nota:{$nota->id_nota}:{$categoria}";
                $payload = [
                    'titulo' => $titulo,
                    'assunto' => $assuntoAluno,
                    'tipo' => "nota_{$categoria}",
                    'origem' => 'sistema',
                    'prioridade' => 'padrao',
                    'criador_id' => null,
                    'criador_nome' => 'Sistema',
                    'event_key' => $eventKey,
                ];

                $this->enviarUmaVez($aluno, $payload);

                $assuntoEquipe = "{$aluno->name}: nota {$notaFormatada} de {$maximoFormatado} ({$percentualFormatado}%) em {$disciplina->nome}, {$periodoNota}.";
                $this->enviarParaEquipeDaDisciplina(
                    $turma,
                    $disciplina->id_disciplina,
                    array_merge($payload, ['assunto' => $assuntoEquipe])
                );
            }

            $disciplinasComFrequencia = collect($alunoDados['faltas'] ?? [])
                ->pluck('disciplina_id')
                ->unique();

            foreach ($disciplinasComFrequencia as $disciplinaId) {
                $disciplina = $disciplinas->get($disciplinaId);
                $registros = $frequencias->get($this->chaveAcademica($aluno->id, $disciplinaId, $periodo));

                if (! $disciplina || ! $registros || $registros->isEmpty()) {
                    continue;
                }

                $totalAulas = (int) $registros->sum('quantidade_aulas');
                $totalFaltas = (int) $registros
                    ->where('status_presenca', 'Falta')
                    ->sum('quantidade_aulas');

                if ($totalAulas === 0) {
                    continue;
                }

                // Usa a mesma projeção trimestral do boletim quando o CSV traz somente faltas.
                if ($totalFaltas > 0 && $totalAulas <= $totalFaltas) {
                    $aulasPrevistasTrimestre = max(
                        20,
                        (int) round(($disciplina->carga_horaria_anual ?: 80) / 3)
                    );
                    $totalAulas = max($totalFaltas, $aulasPrevistasTrimestre);
                }

                $percentualPresenca = (($totalAulas - $totalFaltas) / $totalAulas) * 100;
                if ($percentualPresenca > 75) {
                    continue;
                }

                $percentualFormatado = number_format($percentualPresenca, 1, ',', '.');
                $eventKey = 'academico:frequencia:'.$turma->id_turma.':'.$aluno->id.':'.$disciplinaId.':'.$inicioPeriodo.':'.Str::slug($periodo);
                $payload = [
                    'titulo' => "Atenção à frequência em {$disciplina->nome}",
                    'assunto' => "Sua presença em {$disciplina->nome}, {$periodo}, chegou a {$percentualFormatado}%. Procure a equipe pedagógica para conversar sobre sua frequência.",
                    'tipo' => 'frequencia_risco',
                    'origem' => 'sistema',
                    'prioridade' => 'padrao',
                    'criador_id' => null,
                    'criador_nome' => 'Sistema',
                    'event_key' => $eventKey,
                ];

                $this->enviarUmaVez($aluno, $payload);
                $this->enviarParaEquipeDaDisciplina($turma, $disciplinaId, array_merge($payload, [
                    'assunto' => "{$aluno->name} está com {$percentualFormatado}% de presença em {$disciplina->nome}, {$periodo}.",
                ]));
            }
        }
    }

    /**
     * Emite o lembrete no destinatário e, quando ainda existe, no autor da mensagem manual.
     *
     * @param  array<string, mixed>  $dadosOriginais
     */
    public function enviarLembreteManual(User $destinatario, ?User $autor, array $dadosOriginais): void
    {
        $eventKey = 'lembrete:'.$dadosOriginais['event_key'];
        $payload = [
            'titulo' => 'Lembrete: notificação ainda não confirmada',
            'assunto' => "A notificação \"{$dadosOriginais['titulo']}\" ainda não foi confirmada.",
            'tipo' => 'lembrete',
            'origem' => 'sistema',
            'prioridade' => 'padrao',
            'criador_id' => null,
            'criador_nome' => 'Sistema',
            'event_key' => $eventKey,
        ];

        $this->enviarUmaVez($destinatario, $payload);
        if ($autor && $autor->is($destinatario)) {
            return;
        }
        if ($autor) {
            $this->enviarUmaVez($autor, $payload);
        }
    }

    /**
     * @param  array<string, mixed>  $dados
     * @return EloquentCollection<int, User>
     */
    private function resolverDestinatarios(User $autor, array $dados): EloquentCollection
    {
        $tipo = $dados['destinatario_tipo'];

        if ($tipo === 'geral' && ! ($autor->isEspecialista() || $autor->isAdm())) {
            abort(403, 'Somente Especialista ou Administrador pode enviar comunicados gerais.');
        }

        if ($tipo === 'geral') {
            return User::query()->where('ativo', true)->get();
        }

        if ($tipo === 'turma') {
            $turma = Turma::findOrFail($dados['turma_id']);
            $this->autorizarTurmaDoProfessor($autor, $turma->id_turma);

            return $turma->alunos()
                ->wherePivot('status_matricula', 'Ativo')
                ->where('users.ativo', true)
                ->get();
        }

        $aluno = User::query()->whereKey($dados['aluno_id'])->where('ativo', true)->firstOrFail();
        if (! $aluno->isAluno()) {
            throw ValidationException::withMessages([
                'aluno_id' => 'As notificações individuais desta tela devem ser enviadas a um aluno.',
            ]);
        }

        $turmasAtivas = Matricula::query()
            ->where('usuario_id', $aluno->id)
            ->where('status_matricula', 'Ativo')
            ->pluck('turma_id');

        if ($turmasAtivas->isEmpty()) {
            throw ValidationException::withMessages([
                'aluno_id' => 'O estudante selecionado não possui matrícula ativa.',
            ]);
        }

        if ($autor->isProfessor() && ! TurmaDisciplina::query()
            ->whereIn('turma_id', $turmasAtivas)
            ->where('professor_id', $autor->id)
            ->exists()) {
            abort(403, 'Você só pode notificar estudantes de turmas em que leciona.');
        }

        return new EloquentCollection([$aluno]);
    }

    private function autorizarTurmaDoProfessor(User $autor, int|string $turmaId): void
    {
        if ($autor->isProfessor() && ! TurmaDisciplina::query()
            ->where('turma_id', $turmaId)
            ->where('professor_id', $autor->id)
            ->exists()) {
            abort(403, 'Você só pode notificar alunos de turmas em que leciona.');
        }
    }

    /**
     * @param  EloquentCollection<int, User>  $destinatarios
     * @return Collection<int, DatabaseNotification>
     */
    private function buscarNotificacoesDoEvento(EloquentCollection $destinatarios, string $eventKey): Collection
    {
        return $destinatarios
            ->flatMap(fn (User $destinatario) => $destinatario->notifications()
                ->where('data->event_key', $eventKey)
                ->get())
            ->unique('id')
            ->values();
    }

    /**
     * A chave estável impede que um novo upload do mesmo registro crie avisos duplicados.
     *
     * @param  array<string, mixed>  $dados
     */
    private function enviarUmaVez(User $destinatario, array $dados): void
    {
        $existe = $destinatario->notifications()
            ->where('data->event_key', $dados['event_key'])
            ->exists();

        if (! $existe) {
            $destinatario->notify(new NotificacaoPortal($dados));
        }
    }

    /**
     * @param  array<string, mixed>  $dados
     */
    private function enviarParaEquipeDaDisciplina(Turma $turma, int|string $disciplinaId, array $dados): void
    {
        $professorId = TurmaDisciplina::query()
            ->where('turma_id', $turma->id_turma)
            ->where('disciplina_id', $disciplinaId)
            ->value('professor_id');

        $equipe = User::query()
            ->where('ativo', true)
            ->where(function ($query) use ($professorId) {
                $query->whereIn('role', [UserRole::ESPECIALISTA->value, UserRole::ADM->value])
                    ->orWhereHas('roleModel', fn ($roleQuery) => $roleQuery->whereIn('slug', ['especialista', 'adm', 'admin']));
                if ($professorId) {
                    $query->orWhere('id', $professorId);
                }
            })
            ->get();

        foreach ($equipe as $membro) {
            $this->enviarUmaVez($membro, $dados);
        }
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function intervaloPeriodo(string $periodo, string $dataAula): array
    {
        preg_match('/([1-3])/', $periodo, $matches);
        $trimestre = (int) ($matches[1] ?? 0);
        if ($trimestre === 0) {
            $mes = (int) date('n', strtotime($dataAula));
            $trimestre = $mes <= 4 ? 1 : ($mes <= 8 ? 2 : 3);
        }

        $ano = (int) date('Y', strtotime($dataAula));
        [$mesInicio, $mesFim] = match ($trimestre) {
            1 => [1, 4],
            2 => [5, 8],
            default => [9, 12],
        };

        return [
            sprintf('%04d-%02d-01', $ano, $mesInicio),
            date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $ano, $mesFim))),
        ];
    }

    private function chaveAcademica(int|string $alunoId, int|string $disciplinaId, string $periodo): string
    {
        return "{$alunoId}_{$disciplinaId}_{$periodo}";
    }
}
