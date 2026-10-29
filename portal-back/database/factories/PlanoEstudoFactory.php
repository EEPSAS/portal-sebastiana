<?php

namespace Database\Factories;

use App\Models\PlanoEstudo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de Planos de Estudos em testes automatizados.
 *
 * @extends Factory<PlanoEstudo>
 */
class PlanoEstudoFactory extends Factory
{
    protected $model = PlanoEstudo::class;

    /**
     * Define os atributos padrão do Plano de Estudos.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Vincula o plano a um usuário criado via factory
            'user_id' => User::factory(),
            'disciplina_id' => null,
            'nome' => 'Plano de Estudos '.fake()->words(2, true),
            'disciplina' => fake()->randomElement(['Matemática', 'Português', 'Física', 'História', 'Biologia']),
            'conteudo' => fake()->randomElement(['Informática Básica', 'Inglês Instrumental', 'Álgebra e Funções', 'Gramática e Redação']),
            'descricao' => fake()->sentence(6),
            'ativo' => true,
        ];
    }
}
