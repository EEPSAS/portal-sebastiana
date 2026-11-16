<?php

namespace Database\Factories;

use App\Models\DonaNanaConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de configurações da assistente Dona Nana em testes automatizados.
 *
 * @extends Factory<DonaNanaConfig>
 */
class DonaNanaConfigFactory extends Factory
{
    protected $model = DonaNanaConfig::class;

    /**
     * Reaproveita os valores canônicos padrão da persona Dona Nana.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return DonaNanaConfig::valoresPadrao();
    }
}
