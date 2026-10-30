<?php

namespace Database\Seeders;

use App\Enums\TipoEvento;
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
                'tipo' => TipoEvento::EVENTOS->value,
                'importante' => true,
                'local' => 'Auditório Principal',
            ],
            [
                'titulo' => 'Reunião de Pais e Mestres - 1º Bimestre',
                'descricao' => 'Apresentação do planejamento pedagógico e alinhamento com os responsáveis.',
                'data_inicio' => '2026-03-21',
                'data_fim' => '2026-03-21',
                'hora_inicio' => '08:00',
                'tipo' => TipoEvento::EVENTOS->value,
                'importante' => true,
                'local' => 'Salas de Aula',
            ],
            [
                'titulo' => 'Avaliações Bimestrais - 1º Bimestre',
                'descricao' => 'Semana de provas e entregas de trabalhos interdisciplinares.',
                'data_inicio' => '2026-04-13',
                'data_fim' => '2026-04-17',
                'hora_inicio' => '07:30',
                'tipo' => TipoEvento::PROVAS_E_TRABALHOS->value,
                'importante' => true,
                'local' => 'Colégio Sebastiana',
            ],
            [
                'titulo' => 'Sábado Letivo Temático de Ciências e Tecnologia',
                'descricao' => 'Exposição de projetos de física, química, robótica e desenvolvimento de software.',
                'data_inicio' => '2026-05-23',
                'data_fim' => '2026-05-23',
                'hora_inicio' => '08:00',
                'tipo' => TipoEvento::SABADO_LETIVO->value,
                'importante' => true,
                'local' => 'Ginásio Poliesportivo',
            ],
            [
                'titulo' => 'Feriado de Tiradentes',
                'descricao' => 'Sem expediente escolar ou administrativo.',
                'data_inicio' => '2026-04-21',
                'data_fim' => '2026-04-21',
                'hora_inicio' => null,
                'tipo' => TipoEvento::FERIADOS_E_RECESSOS->value,
                'importante' => false,
                'local' => 'Geral',
            ],
            [
                'titulo' => 'Recesso Escolar de Julho',
                'descricao' => 'Férias de meio de ano dos discentes e recesso pedagógico.',
                'data_inicio' => '2026-07-13',
                'data_fim' => '2026-07-26',
                'hora_inicio' => null,
                'tipo' => TipoEvento::FERIADOS_E_RECESSOS->value,
                'importante' => true,
                'local' => 'Geral',
            ],
        ];

        foreach ($eventos as $item) {
            Evento::updateOrCreate(
                ['titulo' => $item['titulo'], 'data_inicio' => $item['data_inicio']],
                array_merge($item, [
                    'criador_id' => $admin->id,
                ])
            );
        }
    }
}
