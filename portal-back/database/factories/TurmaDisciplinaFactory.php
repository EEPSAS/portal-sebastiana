<?php

namespace Database\Factories;

use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TurmaDisciplina>
 */
class TurmaDisciplinaFactory extends Factory
{
    protected $model = TurmaDisciplina::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'turma_id' => Turma::factory(),
            'disciplina_id' => Disciplina::factory(),
            'professor_id' => User::factory()->professor(),
        ];
    }
}
