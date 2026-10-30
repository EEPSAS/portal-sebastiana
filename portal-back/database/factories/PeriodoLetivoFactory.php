<?php

namespace Database\Factories;

use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PeriodoLetivo>
 */
class PeriodoLetivoFactory extends Factory
{
    protected $model = PeriodoLetivo::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ano = fake()->unique()->numberBetween(2020, 2035);

        return [
            'ano' => $ano,
            'tipo_divisao' => 'trimestre',
            'total_pontos' => 100.00,
            'data_inicio' => "{$ano}-02-05",
            'data_fim' => "{$ano}-12-18",
            'ativo' => false,
            'status' => 'planejado',
        ];
    }

    /**
     * Estado para período letivo ativo.
     */
    public function ativo(): static
    {
        return $this->state(fn (array $attributes) => [
            'ativo' => true,
            'status' => 'em_andamento',
        ]);
    }

    /**
     * Configura automaticamente as 3 divisões trimestrais padrão (30, 30 e 40 pts).
     */
    public function comTrimestres(): static
    {
        return $this->afterCreating(function (PeriodoLetivo $periodo) {
            $ano = $periodo->ano;

            PeriodoLetivoDivisao::create([
                'periodo_letivo_id' => $periodo->id_periodo_letivo,
                'numero' => 1,
                'nome' => '1º Trimestre',
                'pontos' => 30.00,
                'data_inicio' => "{$ano}-02-05",
                'data_fim' => "{$ano}-04-30",
                'ordem' => 1,
            ]);

            PeriodoLetivoDivisao::create([
                'periodo_letivo_id' => $periodo->id_periodo_letivo,
                'numero' => 2,
                'nome' => '2º Trimestre',
                'pontos' => 30.00,
                'data_inicio' => "{$ano}-05-02",
                'data_fim' => "{$ano}-08-31",
                'ordem' => 2,
            ]);

            PeriodoLetivoDivisao::create([
                'periodo_letivo_id' => $periodo->id_periodo_letivo,
                'numero' => 3,
                'nome' => '3º Trimestre',
                'pontos' => 40.00,
                'data_inicio' => "{$ano}-09-01",
                'data_fim' => "{$ano}-12-18",
                'ordem' => 3,
            ]);
        });
    }

    /**
     * Configura 4 divisões bimestrais (25 pts cada).
     */
    public function comBimestres(): static
    {
        return $this->state(fn () => [
            'tipo_divisao' => 'bimestre',
        ])->afterCreating(function (PeriodoLetivo $periodo) {
            $ano = $periodo->ano;

            $bimestres = [
                ['num' => 1, 'nome' => '1º Bimestre', 'inicio' => "{$ano}-02-05", 'fim' => "{$ano}-04-15"],
                ['num' => 2, 'nome' => '2º Bimestre', 'inicio' => "{$ano}-04-16", 'fim' => "{$ano}-06-30"],
                ['num' => 3, 'nome' => '3º Bimestre', 'inicio' => "{$ano}-08-01", 'fim' => "{$ano}-09-30"],
                ['num' => 4, 'nome' => '4º Bimestre', 'inicio' => "{$ano}-10-01", 'fim' => "{$ano}-12-18"],
            ];

            foreach ($bimestres as $b) {
                PeriodoLetivoDivisao::create([
                    'periodo_letivo_id' => $periodo->id_periodo_letivo,
                    'numero' => $b['num'],
                    'nome' => $b['nome'],
                    'pontos' => 25.00,
                    'data_inicio' => $b['inicio'],
                    'data_fim' => $b['fim'],
                    'ordem' => $b['num'],
                ]);
            }
        });
    }
}
