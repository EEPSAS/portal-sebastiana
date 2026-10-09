<?php

namespace Database\Factories;

use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Frequencia>
 */
class FrequenciaFactory extends Factory
{
    protected $model = Frequencia::class;

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
            'usuario_id' => User::factory(),
            'data_aula' => now()->format('Y-m-d'),
            'quantidade_aulas' => 2,
            'status_presenca' => 'Presente',
            'remessa_origem_id' => null,
            'justificativa' => null,
        ];
    }

    public function falta(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_presenca' => 'Falta',
        ]);
    }

    public function faltaJustificada(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_presenca' => 'Falta Justificada',
            'justificativa' => 'Atestado médico',
        ]);
    }
}
