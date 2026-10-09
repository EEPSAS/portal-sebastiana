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
        $categoria = fake()->randomElement(['Acadêmico', 'Biblioteca', 'Eventos', 'Geral', 'Esportes']);
        $data = fake()->dateTimeThisYear();

        return [
            'categoria' => $categoria,
            'titulo' => fake()->sentence(6),
            'descricao' => fake()->paragraph(),
            'conteudo' => fake()->paragraphs(3, true),
            'imagem' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
            'miniatura' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300',
            'dataPublicacao' => $data,
            'destaque' => false,
            'autor_id' => User::factory()->adm(),
        ];
    }

    public function destaque(): static
    {
        return $this->state(fn (array $attributes) => [
            'destaque' => true,
        ]);
    }
}
