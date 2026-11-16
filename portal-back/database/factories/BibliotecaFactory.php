<?php

namespace Database\Factories;

use App\Models\Biblioteca;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de registros de preferências da Biblioteca do usuário.
 *
 * @extends Factory<Biblioteca>
 */
class BibliotecaFactory extends Factory
{
    protected $model = Biblioteca::class;

    /**
     * Define uma estrutura JSON padrão de biblioteca pessoal.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'dados' => [
                'favoritos' => [],
                'historico_pesquisa' => ['Matemática', 'Português'],
            ],
        ];
    }
}
