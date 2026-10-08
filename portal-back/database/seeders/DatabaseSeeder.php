<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Evento;
use App\Models\Noticia;
use App\Models\Radioatividade;
use App\Models\Biblioteca;
use App\Models\Academico;


class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UsuarioSeeder::class,
            EventoSeeder::class,
            NoticiaSeeder::class,
            RadioatividadeSeeder::class,
            BibliotecaSeeder::class,
            AcademicoSeeder::class,
            AtividadeSeeder::class,
        ]);
    }
}
