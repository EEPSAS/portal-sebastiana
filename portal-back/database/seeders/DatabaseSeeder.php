<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\Noticia;
use App\Models\Radioatividade;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UsuarioSeeder::class,
        ]);

        if (class_exists(Noticia::class)) {
            Noticia::factory(10)->create();
        }

        if (class_exists(Radioatividade::class)) {
            Radioatividade::factory(5)->create();
        }

        if (class_exists(Evento::class)) {
            Evento::factory(10)->create();
        }
    }
}
