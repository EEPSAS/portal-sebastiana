<?php

namespace Database\Factories;

use App\Models\Horario;
use App\Models\Turma;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de grades de Horário Escolar em testes automatizados.
 *
 * @extends Factory<Horario>
 */
class HorarioFactory extends Factory
{
    protected $model = Horario::class;

    /**
     * Define o estado padrão do horário vinculado a uma turma ativa.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'turma_id' => Turma::factory(),
            'ano_letivo' => (int) date('Y'),
            'status' => 'Publicado',
        ];
    }
}
