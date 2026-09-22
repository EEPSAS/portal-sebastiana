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
            'conteudo' => fake()->paragraphs(3, true), 
            'url_foto' => fake()->imageUrl(800, 600, 'news', true),
            'data_publicacao' => fake()->dateTimeThisYear(), 
            
            'autor_id' => User::factory(),
        ];
    }
}
