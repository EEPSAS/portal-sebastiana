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
            'titulo' => fake()->sentence(6), 
            'descricao' => fake()->sentence(14),
            'conteudo' => fake()->paragraphs(3, true), 
            'categoria' => fake()->randomElement(['Eventos', 'Projetos', 'Comunicados']),
            'url_foto' => fake()->imageUrl(800, 600, 'news', true),
            'url_miniatura' => fake()->imageUrl(400, 240, 'news', true),
            'data_publicacao' => fake()->dateTimeThisYear(), 
            'destaque' => false,
            
            'autor_id' => User::factory(),
        ];
    }
}
