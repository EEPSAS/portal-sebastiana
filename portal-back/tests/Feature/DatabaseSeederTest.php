<?php

use App\Models\DonaNanaConfig;
use App\Models\Evento;
use App\Models\Livro;
use App\Models\Noticia;
use App\Models\PeriodoLetivo;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Schema;

/**
 * Smoke test dedicado do DatabaseSeeder no PostgreSQL.
 * Substitui o antigo SeededRoutesTest validando que toda a cadeia de seeders
 * executa sem violações de chave estrangeira e que a tabela 'radioatividades' permanece ausente.
 */
test('DatabaseSeeder popula o banco PostgreSQL sem erros e respeita o expurgo de radioatividades', function () {
    $this->seed(DatabaseSeeder::class);

    expect(User::count())->toBeGreaterThan(0)
        ->and(Turma::count())->toBeGreaterThan(0)
        ->and(PeriodoLetivo::where('ativo', true)->exists())->toBeTrue()
        ->and(Livro::count())->toBeGreaterThan(0)
        ->and(Noticia::count())->toBeGreaterThan(0)
        ->and(Evento::count())->toBeGreaterThan(0)
        ->and(DonaNanaConfig::count())->toBeGreaterThan(0)
        ->and(Schema::hasTable('radioatividades'))->toBeFalse();
});
