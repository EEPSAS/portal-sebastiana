<?php

namespace Database\Factories;

use App\Models\Noticia;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Noticia>
 */
class NoticiaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categoria = fake()->sentence(2);

        return [
            'categoria' => $categoria,
            'titulo' => fake()->sentence(6),
            'descricao' => fake()->paragraph(),
            'conteudo' => fake()->paragraphs(3, true),
            'imagem' => 'https://placehold.co/800x600?text=' . urlencode("Notícia: {$categoria}"),
            'miniatura' => 'https://placehold.co/400x300?text=' . urlencode("Miniatura: {$categoria}"),
            'dataPublicacao' => fake()->dateTimeThisYear(),
            'autor_id' => User::factory(),
        ];
    }
}
