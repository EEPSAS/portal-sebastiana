<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Turno - Gestão de Turnos de Funcionamento e Módulos de Aula da Escola.
 *
 * Papel Didático:
 * Centraliza os horários operacionais dos turnos escolares (Matutino, Vespertino,
 * Noturno e Integral). Permite configurar a duração dos módulos de aula (em minutos),
 * horários de início e término e faixas de intervalo/recreio.
 */
class Turno extends Model
{
    use HasFactory;

    protected $table = 'turnos';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nome',
        'hora_inicio',
        'hora_fim',
        'duracao_aula_minutos',
        'intervalo_inicio',
        'intervalo_fim',
        'quantidade_aulas',
        'ativo',
        'descricao',
        'icone',
        'cor',
        'grade_horarios',
    ];

    protected function casts(): array
    {
        return [
            'duracao_aula_minutos' => 'integer',
            'quantidade_aulas' => 'integer',
            'ativo' => 'boolean',
            'grade_horarios' => 'array',
        ];
    }

    /**
     * Resolve o binding de rota de forma robusta e insensível a maiúsculas/minúsculas.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('id', $value)
            ->orWhereRaw('LOWER(id) = ?', [strtolower((string) $value)])
            ->first();
    }

    /**
     * Calcula ou recupera a grade sequencial de horários e intervalos das aulas do turno.
     * Retorna a lista de módulos contendo hora de início, término e marcação de intervalo.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obterGradeHorarios(): array
    {
        // Se houver uma grade customizada persistida no banco, utiliza diretamente
        if (! empty($this->grade_horarios) && is_array($this->grade_horarios)) {
            return $this->grade_horarios;
        }

        return $this->gerarGradeAutomatica();
    }

    /**
     * Gera automaticamente a sequência de horários de aula respeitando a duração
     * em minutos e a pausa oficial para o recreio/intervalo.
     *
     * @return array<int, array<string, mixed>>
     */
    public function gerarGradeAutomatica(): array
    {
        $grade = [];
        $qtdAulas = max(1, (int) $this->quantidade_aulas);
        $duracao = max(30, (int) $this->duracao_aula_minutos);

        $cursor = Carbon::createFromFormat('H:i', $this->hora_inicio ?: '07:00');
        $intervaloInicio = $this->intervalo_inicio
            ? Carbon::createFromFormat('H:i', $this->intervalo_inicio)
            : null;
        $intervaloFim = $this->intervalo_fim
            ? Carbon::createFromFormat('H:i', $this->intervalo_fim)
            : null;

        $intervaloInserido = false;

        for ($numero = 1; $numero <= $qtdAulas; $numero++) {
            // Se o cursor atingiu ou ultrapassou o horário de início do intervalo (e ainda não foi inserido)
            if ($intervaloInicio && $intervaloFim && ! $intervaloInserido && $cursor->gte($intervaloInicio)) {
                $grade[] = [
                    'is_intervalo' => true,
                    'aula_numero' => null,
                    'hora_inicio' => $intervaloInicio->format('H:i'),
                    'hora_fim' => $intervaloFim->format('H:i'),
                    'rotulo' => 'Intervalo / Recreio',
                ];
                $cursor = $intervaloFim->copy();
                $intervaloInserido = true;
            }

            $inicioAula = $cursor->format('H:i');
            $fimAulaCarbon = $cursor->copy()->addMinutes($duracao);
            $fimAula = $fimAulaCarbon->format('H:i');

            // Caso especial da última aula no horário limite do turno (ex: 12:15 no Matutino)
            if ($numero === $qtdAulas && ! empty($this->hora_fim)) {
                $limiteTurno = Carbon::createFromFormat('H:i', $this->hora_fim);
                if ($fimAulaCarbon->diffInMinutes($limiteTurno, false) !== 0) {
                    $fimAula = $limiteTurno->format('H:i');
                }
            }

            $grade[] = [
                'is_intervalo' => false,
                'aula_numero' => $numero,
                'hora_inicio' => $inicioAula,
                'hora_fim' => $fimAula,
                'rotulo' => "{$numero}ª aula",
            ];

            $cursor = Carbon::createFromFormat('H:i', $fimAula);
        }

        return $grade;
    }
}
