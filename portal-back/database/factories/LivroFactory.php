<?php

namespace Database\Factories;

use App\Models\Livro;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Livro>
 */
class LivroFactory extends Factory
{
    protected $model = Livro::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $data = fake()->date();

        return [
            // Gera um código único de catalogação para testes automatizados
            'codigo_livro' => 'LIV-'.fake()->unique()->numerify('####'),
            'titulo' => fake()->sentence(3),
            'capa' => 'https://placehold.co/300x450',
            'autor' => fake()->name(),
            'editora' => fake()->company(),
            'data_lancamento' => $data,
            'data_publicacao' => $data,
            'prateleira_localizacao' => 'Corredor '.fake()->randomElement(['A', 'B', 'C']).', Estante '.fake()->numberBetween(1, 10),
            'genero' => fake()->randomElement(['Ficção', 'Romance', 'Ciência', 'História', 'Matemática']),
            'quantidade_total' => 5,
            'quantidade_disponivel' => 5,
        ];
    }

    public function indisponivel(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantidade_disponivel' => 0,
        ]);
    }
}
