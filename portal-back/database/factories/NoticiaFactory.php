<?php

namespace Database\Factories;

use App\Models\Noticia;
use App\Models\User;
<<<<<<< Updated upstream
use Illuminate\Database\Eloquent\Factories\Factory;
=======
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
            'categoria' => fake()->sentence(2),
            'titulo' => fake()->sentence(6),
            'descricao' => fake()->paragraph(),
            'conteudo' => fake()->paragraphs(3, true),
            'imagem' => fake()->imageUrl(800, 600, 'news', true),
            'miniatura' => fake()->imageUrl(400, 300, 'news', true),
            'dataPublicacao' => fake()->dateTimeThisYear(),

=======
            'categoria' => $categoria,
            'titulo' => fake()->sentence(6), 
            'descricao' => fake()->paragraph(),
            'conteudo' => fake()->paragraphs(3, true), 
            'imagem' => "https://placehold.co/800x600?text=" . urlencode("Notícia: $categoria"),
            'miniatura' => "https://placehold.co/400x300?text=" . urlencode("Miniatura: $categoria"),
            'dataPublicacao' => fake()->dateTimeThisYear(), 
>>>>>>> Stashed changes
            'autor_id' => User::factory(),
        ];
    }
}
<<<<<<< Updated upstream

// 'categoria', 'titulo', 'descricao','conteudo', 'imagem', 'dataPublicacao','autor_id'
=======
>>>>>>> Stashed changes
