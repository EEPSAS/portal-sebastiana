<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'adm')->first() ?? User::factory()->create();

        $eventos = [
            [
                'titulo' => 'Início do Ano Letivo 2026',
                'descricao' => 'Recepção dos alunos novatos e veteranos, apresentação do corpo docente.',
                'data_inicio' => '2026-02-09',
                'data_fim' => '2026-02-09',
                'hora_inicio' => '07:30',
                'hora_fim' => '12:00',
                'dia_inteiro' => false,
                'tipo' => 'Datas Comemorativas',
                'importante' => true,
                'local' => 'Auditório Principal',
                'cor' => '#3b82f6',
            ],
            [
                'titulo' => 'Reunião de Pais e Mestres - 1º Bimestre',
                'descricao' => 'Apresentação do planejamento pedagógico e alinhamento com os responsáveis.',
                'data_inicio' => '2026-03-21',
                'data_fim' => '2026-03-21',
                'hora_inicio' => '08:00',
                'hora_fim' => '11:30',
                'dia_inteiro' => false,
                'tipo' => 'Eventos',
                'importante' => true,
                'local' => 'Salas de Aula',
                'cor' => '#10b981',
            ],
            [
                'titulo' => 'Avaliações Bimestrais - 1º Bimestre',
                'descricao' => 'Semana de provas e entregas de trabalhos interdisciplinares.',
                'data_inicio' => '2026-04-13',
                'data_fim' => '2026-04-17',
                'dia_inteiro' => true,
                'tipo' => 'Provas e Trabalhos',
                'importante' => true,
                'local' => 'Colégio Sebastiana',
                'cor' => '#ef4444',
            ],
            [
                'titulo' => 'Feira de Ciências e Tecnologia',
                'descricao' => 'Exposição de projetos de física, química, robótica e desenvolvimento de software.',
                'data_inicio' => '2026-05-20',
                'data_fim' => '2026-05-21',
                'hora_inicio' => '08:00',
                'hora_fim' => '17:00',
                'dia_inteiro' => false,
                'tipo' => 'Eventos',
                'importante' => true,
                'local' => 'Ginásio Poliesportivo',
                'cor' => '#8b5cf6',
            ],
            [
                'titulo' => 'Feriado de Tiradentes',
                'descricao' => 'Sem expediente escolar ou administrativo.',
                'data_inicio' => '2026-04-21',
                'data_fim' => '2026-04-21',
                'dia_inteiro' => true,
                'tipo' => 'Feriados e Recessos',
                'importante' => false,
                'local' => 'Geral',
                'cor' => '#6b7280',
            ],
            [
                'titulo' => 'Recesso Escolar de Julho',
                'descricao' => 'Férias de meio de ano dos discentes e recesso pedagógico.',
                'data_inicio' => '2026-07-13',
                'data_fim' => '2026-07-26',
                'dia_inteiro' => true,
                'tipo' => 'Feriados e Recessos',
                'importante' => true,
                'local' => 'Geral',
                'cor' => '#f59e0b',
            ],
        ];

        foreach ($eventos as $item) {
            Evento::create(array_merge($item, [
                'criador_id' => $admin->id,
            ]));
        }
    }
}
