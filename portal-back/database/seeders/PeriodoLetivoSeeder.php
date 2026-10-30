<?php

namespace Database\Seeders;

use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use Illuminate\Database\Seeder;

/**
 * PeriodoLetivoSeeder - Povoamento inicial oficial do Período Letivo
 *
 * Papel Didático:
 * Cadastra o Ano Letivo 2026 como período vigente e ativo na EEPSAS, configurado
 * no modelo trimestral (30, 30 e 40 pontos, totalizando 100 pontos), estabelecendo
 * as datas oficiais de início e término de cada ciclo avaliativo.
 */
class PeriodoLetivoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $periodo2026 = PeriodoLetivo::updateOrCreate(
            ['ano' => 2026],
            [
                'tipo_divisao' => 'trimestre',
                'total_pontos' => 100.00,
                'data_inicio' => '2026-02-05',
                'data_fim' => '2026-12-18',
                'ativo' => true,
                'status' => 'em_andamento',
            ]
        );

        $divisoes = [
            [
                'numero' => 1,
                'nome' => '1º Trimestre',
                'pontos' => 30.00,
                'data_inicio' => '2026-02-05',
                'data_fim' => '2026-04-30',
                'ordem' => 1,
            ],
            [
                'numero' => 2,
                'nome' => '2º Trimestre',
                'pontos' => 30.00,
                'data_inicio' => '2026-05-02',
                'data_fim' => '2026-08-31',
                'ordem' => 2,
            ],
            [
                'numero' => 3,
                'nome' => '3º Trimestre',
                'pontos' => 40.00,
                'data_inicio' => '2026-09-01',
                'data_fim' => '2026-12-18',
                'ordem' => 3,
            ],
        ];

        foreach ($divisoes as $d) {
            PeriodoLetivoDivisao::updateOrCreate(
                [
                    'periodo_letivo_id' => $periodo2026->id_periodo_letivo,
                    'numero' => $d['numero'],
                ],
                [
                    'nome' => $d['nome'],
                    'pontos' => $d['pontos'],
                    'data_inicio' => $d['data_inicio'],
                    'data_fim' => $d['data_fim'],
                    'ordem' => $d['ordem'],
                ]
            );
        }
    }
}
