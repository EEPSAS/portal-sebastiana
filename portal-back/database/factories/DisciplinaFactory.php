<?php

namespace Database\Factories;

use App\Models\Disciplina;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Disciplina>
 */
class DisciplinaFactory extends Factory
{
    protected $model = Disciplina::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => fake()->randomElement([
                'Matemática', 'Língua Portuguesa', 'Física', 'Química', 'Biologia',
                'História', 'Geografia', 'Filosofia', 'Sociologia', 'Inglês', 'Artes',
                'Educação Física', 'Robótica', 'Programação Web', 'Literatura',
            ]).' '.fake()->unique()->numberBetween(1, 9999),
            'carga_horaria_anual' => 80,
            'descricao' => fake()->sentence(),
            'ementa' => fake()->paragraph(),
            'habilidades_bncc' => 'EM13MAT'.fake()->numerify('###'),
            'objetivo_geral' => fake()->sentence(),
            'objetivo_especifico' => fake()->sentence(),
        ];
    }
}
