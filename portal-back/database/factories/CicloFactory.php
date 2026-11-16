<?php

namespace Database\Factories;

use App\Models\Ciclo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de Ciclos Escolares em testes automatizados.
 *
 * @extends Factory<Ciclo>
 */
class CicloFactory extends Factory
{
    protected $model = Ciclo::class;

    /**
     * Define o estado padrão de um Ciclo Escolar.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => fake()->unique()->numerify('#º Ano - Ciclo ##'),
            'descricao' => fake()->sentence(6),
        ];
    }
}
