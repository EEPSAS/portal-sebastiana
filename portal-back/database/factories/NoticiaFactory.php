<?php

namespace Database\Factories;

use App\Models\Noticia;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
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
        return [
            'categoria' => fake()->sentence(2),
            'titulo' => fake()->sentence(6), 
            'descricao' => fake()->paragraph(),
            'conteudo' => fake()->paragraphs(3, true), 
            'imagem' => fake()->imageUrl(800, 600, 'news', true),
            'miniatura' => fake()->imageUrl(400, 300, 'news', true),
            'dataPublicacao' => fake()->dateTimeThisYear(), 
            
            'autor_id' => User::factory(),
        ];
    }
}

//'categoria', 'titulo', 'descricao','conteudo', 'imagem', 'dataPublicacao','autor_id'