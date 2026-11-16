<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Horario;
use App\Models\HorarioAula;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de aulas individuais dentro de uma grade de horário escolar.
 *
 * @extends Factory<HorarioAula>
 */
class HorarioAulaFactory extends Factory
{
    protected $model = HorarioAula::class;

    /**
     * Define uma alocação padrão de aula (dia 1..5 e aula 1..5).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'horario_id' => Horario::factory(),
            'dia_semana' => fake()->numberBetween(1, 5),
            'aula_numero' => fake()->numberBetween(1, 5),
            'disciplina_id' => Disciplina::factory(),
            'professor_id' => User::factory()->state(['role' => UserRole::PROFESSOR]),
        ];
    }
}
