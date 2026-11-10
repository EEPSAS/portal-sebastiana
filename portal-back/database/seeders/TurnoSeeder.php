<?php

namespace Database\Seeders;

use App\Models\Turno;
use Illuminate\Database\Seeder;

/**
 * Seeder TurnoSeeder - Popula os 4 turnos canônicos com a grade operacional real da EEPSAS.
 */
class TurnoSeeder extends Seeder
{
    public function run(): void
    {
        $turnos = Turno::obterPadroesCanonicos();

        foreach ($turnos as $dados) {
            $turno = Turno::updateOrCreate(
                ['id' => $dados['id']],
                $dados
            );

            // Garante que a grade_horarios esteja sincronizada
            $turno->update([
                'grade_horarios' => $turno->gerarGradeAutomatica(),
            ]);
        }
    }
}
