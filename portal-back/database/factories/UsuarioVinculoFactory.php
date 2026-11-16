<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\UsuarioVinculo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de registros no histórico de vínculos institucionais do usuário.
 *
 * @extends Factory<UsuarioVinculo>
 */
class UsuarioVinculoFactory extends Factory
{
    protected $model = UsuarioVinculo::class;

    /**
     * Define um vínculo institucional ativo iniciado na data atual.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'usuario_id' => User::factory(),
            'role_no_vinculo' => UserRole::ALUNO->value,
            'autorizado_por_id' => User::factory()->state(['role' => UserRole::ADM]),
            'iniciado_em' => now(),
            'encerrado_em' => null,
            'encerrado_por_id' => null,
            'observacoes' => 'Vínculo gerado para teste automatizado.',
        ];
    }
}
