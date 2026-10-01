<?php

namespace Database\Factories;

use App\Models\Disciplina;
use App\Models\RemessaDocente;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RemessaDocente>
 */
class RemessaDocenteFactory extends Factory
{
    protected $model = RemessaDocente::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'professor_id' => User::factory(),
            'turma_id' => Turma::factory(),
            'disciplina_id' => Disciplina::factory(),
            'tipo_dado' => fake()->randomElement(['Frequência', 'Notas', 'Ambos']),
            'arquivo_anexo' => 'remessas/diario_classe_exemplo.xlsx',
            'data_envio' => now(),
            'status_processamento' => 'Pendente',
            'observacoes' => fake()->sentence(),
        ];
    }

    public function anexado(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_processamento' => 'Anexado',
        ]);
    }

    public function rejeitado(): static
    {
        return $this->state(fn (array $attributes) => [
            'status_processamento' => 'Rejeitado',
        ]);
    }
}
