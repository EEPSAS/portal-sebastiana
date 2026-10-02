<?php

namespace Database\Factories;

use App\Models\Turma;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Turma>
 */
class TurmaFactory extends Factory
{
    protected $model = Turma::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome_identificador' => fake()->randomElement(['1º Ano', '2º Ano', '3º Ano']).' '.fake()->randomElement(['A', 'B', 'C']).' - Ensino Médio',
            'turno' => fake()->randomElement(['Manhã', 'Tarde', 'Noite', 'Integral']),
            'ano_letivo' => 2026,
            'capacidade_maxima' => 40,
            'status' => 'Ativa',
        ];
    }

    public function concluida(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'Concluída',
        ]);
    }
}
