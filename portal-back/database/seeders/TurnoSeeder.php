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
        $turnos = [
            [
                'id' => 'Matutino',
                'nome' => 'Matutino',
                'hora_inicio' => '07:00',
                'hora_fim' => '12:15',
                'duracao_aula_minutos' => 50,
                'intervalo_inicio' => '09:30',
                'intervalo_fim' => '09:45',
                'quantidade_aulas' => 5,
                'pausas' => [
                    [
                        'tipo' => 'intervalo',
                        'rotulo' => 'Intervalo / Recreio',
                        'hora_inicio' => '09:30',
                        'hora_fim' => '09:45',
                    ],
                ],
                'ativo' => true,
                'descricao' => 'Turno da manhã, com aulas de 50 minutos e intervalo das 09:30 às 09:45.',
                'icone' => 'bi-sun-fill',
                'cor' => 'warning',
            ],
            [
                'id' => 'Vespertino',
                'nome' => 'Vespertino',
                'hora_inicio' => '12:50',
                'hora_fim' => '16:25',
                'duracao_aula_minutos' => 50,
                'intervalo_inicio' => '14:30',
                'intervalo_fim' => '14:45',
                'quantidade_aulas' => 4,
                'pausas' => [
                    [
                        'tipo' => 'intervalo',
                        'rotulo' => 'Intervalo / Recreio',
                        'hora_inicio' => '14:30',
                        'hora_fim' => '14:45',
                    ],
                ],
                'ativo' => true,
                'descricao' => 'Turno da tarde, com início às 12:50, intervalo das 14:30 às 14:45 e término às 16:25.',
                'icone' => 'bi-brightness-alt-high-fill',
                'cor' => 'primary',
            ],
            [
                'id' => 'Noturno',
                'nome' => 'Noturno',
                'hora_inicio' => '18:45',
                'hora_fim' => '22:15',
                'duracao_aula_minutos' => 45,
                'intervalo_inicio' => '20:15',
                'intervalo_fim' => '20:30',
                'quantidade_aulas' => 4,
                'pausas' => [
                    [
                        'tipo' => 'intervalo',
                        'rotulo' => 'Intervalo / Recreio',
                        'hora_inicio' => '20:15',
                        'hora_fim' => '20:30',
                    ],
                ],
                'ativo' => false,
                'descricao' => 'Turno da noite, voltado prioritariamente para EJA e Cursos Noturnos.',
                'icone' => 'bi-moon-stars-fill',
                'cor' => 'indigo',
            ],
            [
                'id' => 'Integral',
                'nome' => 'Integral',
                'hora_inicio' => '07:00',
                'hora_fim' => '16:40',
                'duracao_aula_minutos' => 50,
                'intervalo_inicio' => '09:30',
                'intervalo_fim' => '09:45',
                'quantidade_aulas' => 9,
                'pausas' => [
                    [
                        'tipo' => 'intervalo',
                        'rotulo' => 'Intervalo da Manhã',
                        'hora_inicio' => '09:30',
                        'hora_fim' => '09:45',
                    ],
                    [
                        'tipo' => 'almoco',
                        'rotulo' => 'Almoço',
                        'hora_inicio' => '11:25',
                        'hora_fim' => '12:50',
                    ],
                    [
                        'tipo' => 'intervalo',
                        'rotulo' => 'Intervalo da Tarde',
                        'hora_inicio' => '14:30',
                        'hora_fim' => '14:45',
                    ],
                ],
                'ativo' => true,
                'descricao' => 'Jornada ampliada do Ensino Médio de Tempo Integral (EMTI) com recreios e almoço.',
                'icone' => 'bi-clock-history',
                'cor' => 'success',
            ],
        ];

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
