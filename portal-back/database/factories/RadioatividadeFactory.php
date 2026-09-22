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
            'titulo' => fake()->sentence(6), // Gera uma frase com cerca de 6 palavras
            'descricao' => fake()->paragraphs(3, true), // Alinhado com $table->text('descricao')
            'imagem' => fake()->imageUrl(800, 600, 'science', true), // Alinhado com $table->string('imagem')
            'duracao' => fake()->time(), // Alinhado com $table->time('duracao')
        ];
    }
}