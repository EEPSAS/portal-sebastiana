<?php

namespace Database\Factories;

use App\Enums\EmprestimoStatus;
use App\Models\Emprestimo;
use App\Models\Livro;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Emprestimo>
 */
class EmprestimoFactory extends Factory
{
    protected $model = Emprestimo::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'livro_id'                => Livro::factory(),
            'usuario_id'              => User::factory(),
            'data_emprestimo'         => now(),
            'data_prevista_devolucao' => now()->addDays(14),
            'data_devolucao_real'     => null,
            'status'                  => EmprestimoStatus::APROVADO,
            'observacoes'             => null,
        ];
    }

    public function solicitado(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'                  => EmprestimoStatus::SOLICITADO,
            'data_emprestimo'         => null,
            'data_prevista_devolucao' => null,
        ]);
    }

    public function devolvido(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'              => EmprestimoStatus::DEVOLVIDO,
            'data_devolucao_real' => now(),
        ]);
    }

    public function atrasado(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'                  => EmprestimoStatus::ATRASADO,
            'data_prevista_devolucao' => now()->subDays(3),
        ]);
    }
}
