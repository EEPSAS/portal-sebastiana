<?php

namespace Database\Factories;

use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PeriodoLetivoDivisao>
 */
class PeriodoLetivoDivisaoFactory extends Factory
{
    protected $model = PeriodoLetivoDivisao::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'periodo_letivo_id' => PeriodoLetivo::factory(),
            'numero' => 1,
            'nome' => '1º Trimestre',
            'pontos' => 30.00,
            'data_inicio' => '2026-02-05',
            'data_fim' => '2026-04-30',
            'ordem' => 1,
        ];
    }
}
