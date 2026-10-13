<?php

namespace Database\Factories;

use App\Models\Atividade;
use App\Models\Submissao;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Submissao>
 */
class SubmissaoFactory extends Factory
{
    protected $model = Submissao::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'atividade_id' => Atividade::factory(),
            'usuario_id' => User::factory(),
            'data_envio' => now(),
            'texto_resposta' => fake()->paragraph(),
            'caminho_arquivo_entregue' => null,
            'nota_atribuida' => null,
            'feedback_comentario_professor' => null,
        ];
    }

    public function avaliada(float $nota = 9.5, ?string $feedback = 'Excelente trabalho!'): static
    {
        return $this->state(fn (array $attributes) => [
            'nota_atribuida' => $nota,
            'feedback_comentario_professor' => $feedback,
        ]);
    }
}
