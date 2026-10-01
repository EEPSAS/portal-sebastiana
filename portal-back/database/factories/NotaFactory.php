<?php

namespace Database\Factories;

use App\Models\Disciplina;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Nota>
 */
class NotaFactory extends Factory
{
    protected $model = Nota::class;

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
            'periodo_letivo' => fake()->randomElement(['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre']),
            'tipo_avaliacao' => fake()->randomElement(['Prova Mensal', 'Trabalho em Grupo', 'Simulado', 'Atividade Avaliativa']),
            'valor_nota' => fake()->randomFloat(2, 4, 10),
            'valor_maximo' => 10.00,
            'data_registro' => now()->format('Y-m-d'),
            'remessa_origem_id' => null,
            'observacoes' => null,
        ];
    }
}
