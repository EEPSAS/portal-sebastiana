<?php

namespace Database\Factories;

use App\Models\Radioatividade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Radioatividade>
 */
class RadioatividadeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'titulo' => fake()->sentence(6),
            'descricao' => fake()->paragraphs(3, true),
            'imagem' => fake()->imageUrl(800, 600, 'science', true),
            'duracao' => fake()->time(),
        ];
    }
}
