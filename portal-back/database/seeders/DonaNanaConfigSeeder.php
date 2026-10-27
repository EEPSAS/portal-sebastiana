<?php

namespace Database\Seeders;

use App\Models\DonaNanaConfig;
use Illuminate\Database\Seeder;

/**
 * Seeder para a configuração inicial da persona da Dona Nana.
 *
 * Papel Didático:
 * Garante que a assistente já inicie povoada com a personalidade completa
 * e pronta para uso desde o primeiro `php artisan migrate --seed`.
 */
class DonaNanaConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DonaNanaConfig::firstOrCreate(
            ['id' => 1],
            DonaNanaConfig::valoresPadrao()
        );
    }
}
