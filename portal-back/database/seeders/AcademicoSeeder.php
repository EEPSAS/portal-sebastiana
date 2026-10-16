<?php

namespace Database\Seeders;

use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * AcademicoSeeder - Povoamento enxuto do ambiente acadêmico.
 *
 * Estrutura:
 * - 3 Turmas ativas com exatamente 1 aluno canônico em cada.
 * - Disciplinas fundamentais vinculadas ao professor.
 * - Exatamente 3 registros de frequência por disciplina (1 por período).
 * - Exatamente 3 registros de notas cumulativas por disciplina (1º, 2º e 3º Trimestres).
 */
class AcademicoSeeder extends Seeder
{
    /**
     * Executa o povoamento acadêmico sem redundâncias ou dados dispersos.
     */
    public function run(): void
    {
        // 1. As 3 Turmas Escolares Ativas
        $turma1A = Turma::updateOrCreate(
            ['nome_identificador' => '1º Ano A - Ensino Médio'],
            [
                'turno' => 'Matutino',
                'ano_letivo' => 2026,
                'capacidade_maxima' => 40,
                'status' => 'Ativa',
            ]
        );

        $turma2B = Turma::updateOrCreate(
            ['nome_identificador' => '2º Ano B - Ensino Médio'],
            [
                'turno' => 'Vespertino',
                'ano_letivo' => 2026,
                'capacidade_maxima' => 35,
                'status' => 'Ativa',
            ]
        );

        $turma3A = Turma::updateOrCreate(
            ['nome_identificador' => '3º Ano A - Informática Integrado'],
            [
                'turno' => 'Integral',
                'ano_letivo' => 2026,
                'capacidade_maxima' => 35,
                'status' => 'Ativa',
            ]
        );

        // 2. Componentes Curriculares (Disciplinas)
        $discMat = Disciplina::updateOrCreate(
            ['nome' => 'Matemática'],
            [
                'carga_horaria_anual' => 120,
                'descricao' => 'Álgebra, geometria analítica, trigonometria e funções matemáticas.',
            ]
        );

        $discPort = Disciplina::updateOrCreate(
            ['nome' => 'Língua Portuguesa e Literatura'],
            [
                'carga_horaria_anual' => 120,
                'descricao' => 'Interpretação textual, produção dissertativa e análise de obras literárias.',
            ]
        );

        $discFis = Disciplina::updateOrCreate(
            ['nome' => 'Física'],
            [
                'carga_horaria_anual' => 80,
                'descricao' => 'Mecânica clássica, leis de Newton, óptica geométrica e termodinâmica.',
            ]
        );

        $discHist = Disciplina::updateOrCreate(
            ['nome' => 'História Geral e do Brasil'],
            [
                'carga_horaria_anual' => 80,
                'descricao' => 'História contemporânea, formação social e econômica do Brasil.',
            ]
        );

        $discDev = Disciplina::updateOrCreate(
            ['nome' => 'Desenvolvimento de Aplicações Web'],
            [
                'carga_horaria_anual' => 100,
                'descricao' => 'Arquitetura MVC, REST APIs em Laravel, bancos relacionais e interfaces modernas.',
            ]
        );

        // 3. Vínculo de Professores às Turmas (Carlos Silva leciona nas turmas)
        $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
        $profId = $profCarlos?->id;

        $disciplinasPorTurma = [
            $turma1A->id_turma => [$discMat, $discPort, $discFis, $discHist],
            $turma2B->id_turma => [$discMat, $discPort, $discFis, $discHist],
            $turma3A->id_turma => [$discDev, $discMat, $discPort, $discHist],
        ];

        foreach ($disciplinasPorTurma as $turmaId => $disciplinas) {
            foreach ($disciplinas as $disc) {
                TurmaDisciplina::firstOrCreate(
                    [
                        'turma_id' => $turmaId,
                        'disciplina_id' => $disc->id_disciplina,
                    ],
                    [
                        'professor_id' => $profId,
                    ]
                );
            }
        }

        // 4. Matrícula: Exatamente 1 Aluno Canônico por Turma
        $distribuicaoCanonica = [
            'yasmin.teixeira@sebastiana.edu.br' => $turma1A,
            'pedro.santos@sebastiana.edu.br' => $turma2B,
            'beatriz.lima@sebastiana.edu.br' => $turma3A,
        ];

        foreach ($distribuicaoCanonica as $email => $turma) {
            $aluno = User::where('email', $email)->first();
            if ($aluno) {
                Matricula::updateOrCreate(
                    [
                        'turma_id' => $turma->id_turma,
                        'usuario_id' => $aluno->id,
                    ],
                    [
                        'data_matricula' => '2026-02-01',
                        'status_matricula' => 'Ativo',
                    ]
                );
            }
        }

        // 5. Frequências: Exatamente 3 registros por matéria (1 aula por trimestre)
        $datasAulas = [
            '2026-03-10', // 1º Trimestre
            '2026-06-10', // 2º Trimestre
            '2026-09-10', // 3º Trimestre
        ];

        foreach ($distribuicaoCanonica as $email => $turma) {
            $aluno = User::where('email', $email)->first();
            if (! $aluno) {
                continue;
            }

            $disciplinas = $disciplinasPorTurma[$turma->id_turma] ?? [];

            foreach ($disciplinas as $disc) {
                foreach ($datasAulas as $dataAula) {
                    Frequencia::updateOrCreate(
                        [
                            'turma_id' => $turma->id_turma,
                            'disciplina_id' => $disc->id_disciplina,
                            'usuario_id' => $aluno->id,
                            'data_aula' => $dataAula,
                        ],
                        [
                            'quantidade_aulas' => 2,
                            'status_presenca' => 'Presente',
                            'justificativa' => null,
                        ]
                    );
                }
            }
        }

        // 6. Notas: Exatamente 3 registros por matéria (1º, 2º e 3º Trimestres da rede estadual MG)
        $trimestresConfig = [
            '1º Trimestre' => [
                'valor_maximo' => 30.00,
                'nota_padrao' => 28.5,
                'data_registro' => '2026-04-28',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
            '2º Trimestre' => [
                'valor_maximo' => 35.00,
                'nota_padrao' => 33.5,
                'data_registro' => '2026-08-25',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
            '3º Trimestre' => [
                'valor_maximo' => 35.00,
                'nota_padrao' => 34.0,
                'data_registro' => '2026-11-20',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
        ];

        foreach ($distribuicaoCanonica as $email => $turma) {
            $aluno = User::where('email', $email)->first();
            if (! $aluno) {
                continue;
            }

            $disciplinas = $disciplinasPorTurma[$turma->id_turma] ?? [];

            foreach ($disciplinas as $disc) {
                foreach ($trimestresConfig as $periodo => $cfg) {
                    Nota::updateOrCreate(
                        [
                            'turma_id' => $turma->id_turma,
                            'disciplina_id' => $disc->id_disciplina,
                            'usuario_id' => $aluno->id,
                            'periodo_letivo' => $periodo,
                        ],
                        [
                            'tipo_avaliacao' => $cfg['tipo_avaliacao'],
                            'valor_nota' => $cfg['nota_padrao'],
                            'valor_maximo' => $cfg['valor_maximo'],
                            'data_registro' => $cfg['data_registro'],
                            'observacoes' => "Pontuação cumulativa oficial do {$periodo}",
                        ]
                    );
                }
            }
        }
    }
}
