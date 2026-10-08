<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\Noticia;
use App\Models\Radioatividade;
use App\Models\User;
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
        User::factory(10)->create();
        Noticia::factory(15)->create();
        Radioatividade::factory(5)->create();
        Evento::factory(20)->create();
    }
}
