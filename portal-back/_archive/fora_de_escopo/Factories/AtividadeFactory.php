<?php

namespace Database\Factories;

use App\Models\Atividade;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Atividade>
 */
class AtividadeFactory extends Factory
{
    protected $model = Atividade::class;

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
            'titulo' => fake()->sentence(4),
            'descricao_texto' => fake()->paragraph(),
            'caminho_arquivo_anexo' => null,
            'data_criacao' => now(),
            'data_limite_entrega' => now()->addDays(7),
            'valor_pontuacao' => 10.00,
            'status_atividade' => 'Aberta',
        ];
    }

    public function encerrada(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_atividade' => 'Encerrada',
        ]);
    }

    public function expirada(): static
    {
        return $this->state(fn (array $attributes) => [
            'data_limite_entrega' => now()->subDay(),
        ]);
    }
}
