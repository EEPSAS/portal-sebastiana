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
        'pausas',
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
            'pausas' => 'array',
            'grade_horarios' => 'array',
        ];
    }

    /**
     * Resolve o binding de rota de forma robusta e insensível a maiúsculas/minúsculas.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     * @return Model|null
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('id', $value)
            ->orWhereRaw('LOWER(id) = ?', [strtolower((string) $value)])
            ->first();
    }

    /**
     * Retorna a lista de pausas cadastradas no turno (intervalos e almoço), ordenadas cronologicamente.
     * Mantém compatibilidade com registros antigos que utilizavam apenas intervalo_inicio e intervalo_fim.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obterPausas(): array
    {
        if (! empty($this->pausas) && is_array($this->pausas)) {
            $pausas = $this->pausas;
            usort($pausas, fn ($a, $b) => strcmp($a['hora_inicio'] ?? '', $b['hora_inicio'] ?? ''));

            return $pausas;
        }

        if (! empty($this->intervalo_inicio) && ! empty($this->intervalo_fim)) {
            return [
                [
                    'tipo' => 'intervalo',
                    'rotulo' => 'Intervalo / Recreio',
                    'hora_inicio' => $this->intervalo_inicio,
                    'hora_fim' => $this->intervalo_fim,
                ],
            ];
        }

        return [];
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
     * em minutos e as pausas oficiais (recreios e horário de almoço).
     *
     * @return array<int, array<string, mixed>>
     */
    public function gerarGradeAutomatica(): array
    {
        $grade = [];
        $qtdAulas = max(1, (int) $this->quantidade_aulas);
        $duracao = max(30, (int) $this->duracao_aula_minutos);

        $cursor = Carbon::createFromFormat('H:i', $this->hora_inicio ?: '07:00');
        $pausas = $this->obterPausas();
        $pausasInseridas = [];

        for ($numero = 1; $numero <= $qtdAulas; $numero++) {
            // Verifica se alguma pausa deve ser inserida antes da próxima aula
            foreach ($pausas as $idx => $pausa) {
                if (in_array($idx, $pausasInseridas, true) || empty($pausa['hora_inicio']) || empty($pausa['hora_fim'])) {
                    continue;
                }

                $inicioPausa = Carbon::createFromFormat('H:i', $pausa['hora_inicio']);
                $fimPausa = Carbon::createFromFormat('H:i', $pausa['hora_fim']);

                if ($cursor->gte($inicioPausa)) {
                    $grade[] = [
                        'is_intervalo' => true,
                        'tipo' => $pausa['tipo'] ?? 'intervalo',
                        'aula_numero' => null,
                        'periodo' => null,
                        'hora_inicio' => $inicioPausa->format('H:i'),
                        'hora_fim' => $fimPausa->format('H:i'),
                        'rotulo' => $pausa['rotulo'] ?? ($pausa['tipo'] === 'almoco' ? 'Almoço' : 'Intervalo / Recreio'),
                    ];
                    $cursor = $fimPausa->copy();
                    $pausasInseridas[] = $idx;
                }
            }

            $inicioAula = $cursor->format('H:i');
            $fimAulaCarbon = $cursor->copy()->addMinutes($duracao);
            $fimAula = $fimAulaCarbon->format('H:i');

            // Caso especial da última aula no horário limite do turno se configurado
            if ($numero === $qtdAulas && ! empty($this->hora_fim)) {
                $limiteTurno = Carbon::createFromFormat('H:i', $this->hora_fim);
                if ($fimAulaCarbon->diffInMinutes($limiteTurno, false) !== 0) {
                    $fimAula = $limiteTurno->format('H:i');
                }
            }

            $grade[] = [
                'is_intervalo' => false,
                'tipo' => 'aula',
                'aula_numero' => $numero,
                'periodo' => $numero,
                'hora_inicio' => $inicioAula,
                'hora_fim' => $fimAula,
                'rotulo' => "{$numero}ª aula",
            ];

            $cursor = Carbon::createFromFormat('H:i', $fimAula);
        }

        // Se ainda restaram pausas cronologicamente após a última aula
        foreach ($pausas as $idx => $pausa) {
            if (! in_array($idx, $pausasInseridas, true) && ! empty($pausa['hora_inicio']) && ! empty($pausa['hora_fim'])) {
                $grade[] = [
                    'is_intervalo' => true,
                    'tipo' => $pausa['tipo'] ?? 'intervalo',
                    'aula_numero' => null,
                    'periodo' => null,
                    'hora_inicio' => $pausa['hora_inicio'],
                    'hora_fim' => $pausa['hora_fim'],
                    'rotulo' => $pausa['rotulo'] ?? ($pausa['tipo'] === 'almoco' ? 'Almoço' : 'Intervalo / Recreio'),
                ];
            }
        }

        return $grade;
    }
}
