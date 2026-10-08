<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\Noticia;
use App\Models\Radioatividade;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Evento;

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

        User::factory(10)->create();
        Noticia::factory(15)->create();
        Radioatividade::factory(5)->create();
        Evento::factory(20)->create();
    }
}
