<?php

namespace Database\Factories;

use App\Enums\TipoEvento;
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
            'tipo' => fake()->randomElement(TipoEvento::cases()),
            'importante' => false,
            'local' => fake()->word(),
            'criador_id' => User::factory()->especialista(),
        ];
    }

    public function importante(): static
    {
        return $this->state(fn (array $attributes) => [
            'importante' => true,
            'tipo' => TipoEvento::EVENTOS,
        ]);
    }
}
