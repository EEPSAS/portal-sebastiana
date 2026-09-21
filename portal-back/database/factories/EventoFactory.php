<?php

namespace Database\Factories;

use App\Models\Evento;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evento>
 */
class EventoFactory extends Factory
{
    protected $model = Evento::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'titulo' => fake()->sentence(3),
            'descricao' => fake()->paragraph(),
            'data_inicio' => fake()->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'data_fim' => null,
            'hora_inicio' => '08:00',
            'hora_fim' => '12:00',
            'dia_inteiro' => false,
            'tipo' => fake()->randomElement(['evento', 'data_importante', 'feriado', 'prova', 'reuniao']),
            'importante' => false,
            'local' => fake()->word(),
            'cor' => '#e6007e',
            'criador_id' => User::factory(),
        ];
    }

    public function importante(): static
    {
        return $this->state(fn (array $attributes) => [
            'importante' => true,
            'tipo' => 'data_importante',
        ]);
    }

    public function diaInteiro(): static
    {
        return $this->state(fn (array $attributes) => [
            'dia_inteiro' => true,
            'hora_inicio' => null,
            'hora_fim' => null,
        ]);
    }
}
