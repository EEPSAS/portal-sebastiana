<?php

namespace Database\Factories;

use App\Models\Matricula;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Matricula>
 */
class MatriculaFactory extends Factory
{
    protected $model = Matricula::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'turma_id' => Turma::factory(),
            'usuario_id' => User::factory(),
            'data_matricula' => now()->format('Y-m-d'),
            'status_matricula' => 'Ativo',
        ];
    }

    public function transferido(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_matricula' => 'Transferido',
        ]);
    }

    public function evadido(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_matricula' => 'Evadido',
        ]);
    }
}
