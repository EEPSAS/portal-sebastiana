<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\RegistroAcao;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de registros de auditoria em testes automatizados.
 *
 * @extends Factory<RegistroAcao>
 */
class RegistroAcaoFactory extends Factory
{
    protected $model = RegistroAcao::class;

    /**
     * Define o estado padrão de um registro de ação para testes Pest.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'entidade_tipo' => Turma::class,
            'entidade_id' => (string) fake()->numberBetween(1, 50),
            'acao' => 'turma_atualizada',
            'descricao' => fake()->sentence(6),
            'executado_por_id' => User::factory(),
            'executado_por_nome' => fake()->name(),
            'executado_por_role' => UserRole::ESPECIALISTA->value,
            'metadados' => null,
        ];
    }
}
