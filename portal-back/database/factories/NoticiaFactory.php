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
            'titulo' => fake()->sentence(6), // Gera uma frase com cerca de 6 palavras
            'conteudo' => fake()->paragraphs(3, true), // Gera 3 parágrafos de texto
            'url_foto' => fake()->imageUrl(800, 600, 'news', true), // Gera uma URL de imagem fake
            'data_publicacao' => fake()->dateTimeThisYear(), // Data aleatória do ano atual
            
            // RELACIONAMENTO 1:N NA FACTORY
            // Se nenhum autor_id for passado na hora de criar a notícia, 
            // o Laravel cria um novo Usuário automaticamente e pega o ID dele.
            'autor_id' => User::factory(),
        ];
    }
}
