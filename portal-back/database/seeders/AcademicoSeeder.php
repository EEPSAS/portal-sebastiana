<?php

namespace Database\Seeders;

use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\RemessaDocente;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Database\Seeder;

class AcademicoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Turmas
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

        // 2. Disciplinas
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

        // 3. Professores
        $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
        $profaMarina = User::where('email', 'marina.souza@sebastiana.edu.br')->first();
        $profLucas = User::where('email', 'lucas.mendes@sebastiana.edu.br')->first();

        // 4. Vinculações (TurmaDisciplina)
        if ($profCarlos) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discMat->id_disciplina, 'professor_id' => $profCarlos->id]);
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discFis->id_disciplina, 'professor_id' => $profCarlos->id]);
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma3A->id_turma, 'disciplina_id' => $discDev->id_disciplina, 'professor_id' => $profCarlos->id]);
        }

        if ($profaMarina) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discPort->id_disciplina, 'professor_id' => $profaMarina->id]);
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma3A->id_turma, 'disciplina_id' => $discPort->id_disciplina, 'professor_id' => $profaMarina->id]);
        }

        if ($profLucas) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discHist->id_disciplina, 'professor_id' => $profLucas->id]);
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma2B->id_turma, 'disciplina_id' => $discHist->id_disciplina, 'professor_id' => $profLucas->id]);
        }

        // 5. Alunos e Matrículas
        $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
        $pedro = User::where('email', 'pedro.santos@sebastiana.edu.br')->first();
        $beatriz = User::where('email', 'beatriz.lima@sebastiana.edu.br')->first();
        $gabriel = User::where('email', 'gabriel.costa@sebastiana.edu.br')->first();
        $camila = User::where('email', 'camila.alves@sebastiana.edu.br')->first();
        $lucasR = User::where('email', 'lucas.rocha@sebastiana.edu.br')->first();

        $alunosTurma1A = array_filter([$yasmin, $pedro, $beatriz, $gabriel]);
        foreach ($alunosTurma1A as $aluno) {
            Matricula::firstOrCreate(
                ['turma_id' => $turma1A->id_turma, 'usuario_id' => $aluno->id],
                [
                    'data_matricula' => '2026-02-01',
                    'status_matricula' => 'Ativo',
                ]
            );
        }

        $alunosTurma3A = array_filter([$camila, $lucasR]);
        foreach ($alunosTurma3A as $aluno) {
            Matricula::firstOrCreate(
                ['turma_id' => $turma3A->id_turma, 'usuario_id' => $aluno->id],
                [
                    'data_matricula' => '2026-02-01',
                    'status_matricula' => 'Ativo',
                ]
            );
        }

        // 6. Remessa Docente
        if ($profCarlos) {
            RemessaDocente::firstOrCreate(
                [
                    'professor_id' => $profCarlos->id,
                    'turma_id' => $turma1A->id_turma,
                    'disciplina_id' => $discMat->id_disciplina,
                    'tipo_dado' => 'Frequência',
                ],
                [
                    'arquivo_anexo' => 'remessas/chamada_fevereiro_carlos.pdf',
                    'data_envio' => now()->subDays(15),
                    'status_processamento' => 'Anexado',
                    'observacoes' => 'Chamada de Fevereiro lançada com êxito.',
                ]
            );

            RemessaDocente::firstOrCreate(
                [
                    'professor_id' => $profCarlos->id,
                    'turma_id' => $turma1A->id_turma,
                    'disciplina_id' => $discFis->id_disciplina,
                    'tipo_dado' => 'Notas',
                ],
                [
                    'arquivo_anexo' => 'remessas/notas_lab_fisica.xlsx',
                    'data_envio' => now()->subDay(),
                    'status_processamento' => 'Pendente',
                    'observacoes' => 'Notas das práticas laboratoriais de Física.',
                ]
            );
        }

        // 7. Frequências (para alunos da Turma 1A em Matemática e Português)
        $datasAulas = ['2026-03-02', '2026-03-04', '2026-03-09', '2026-03-11', '2026-03-16'];
        foreach ($datasAulas as $idx => $dataAula) {
            foreach ($alunosTurma1A as $aluno) {
                // Matemática
                $presencaMat = ($aluno->email === 'beatriz.lima@sebastiana.edu.br' && $idx === 2) ? 'Falta' : 'Presente';
                Frequencia::updateOrCreate(
                    [
                        'turma_id' => $turma1A->id_turma,
                        'disciplina_id' => $discMat->id_disciplina,
                        'usuario_id' => $aluno->id,
                        'data_aula' => $dataAula,
                    ],
                    [
                        'quantidade_aulas' => 2,
                        'status_presenca' => $presencaMat,
                        'remessa_origem_id' => null,
                    ]
                );

                // Língua Portuguesa
                $presencaPort = ($aluno->email === 'pedro.santos@sebastiana.edu.br' && $idx === 3) ? 'Falta Justificada' : 'Presente';
                Frequencia::updateOrCreate(
                    [
                        'turma_id' => $turma1A->id_turma,
                        'disciplina_id' => $discPort->id_disciplina,
                        'usuario_id' => $aluno->id,
                        'data_aula' => $dataAula,
                    ],
                    [
                        'quantidade_aulas' => 2,
                        'status_presenca' => $presencaPort,
                        'justificativa' => $presencaPort === 'Falta Justificada' ? 'Consulta Odontológica' : null,
                    ]
                );
            }
        }

        // 8. Notas (Boletim com 1º e 2º Bimestres)
        $notasBase = [
            'yasmin.teixeira@sebastiana.edu.br' => [
                'Matemática' => ['1º Bimestre' => [9.0, 9.5], '2º Bimestre' => [8.5, 9.0]],
                'Língua Portuguesa e Literatura' => ['1º Bimestre' => [9.5, 10.0], '2º Bimestre' => [9.0, 9.5]],
                'Física' => ['1º Bimestre' => [8.0, 8.5], '2º Bimestre' => [8.0, 9.0]],
                'História Geral e do Brasil' => ['1º Bimestre' => [9.0, 9.0], '2º Bimestre' => [9.5, 10.0]],
            ],
            'pedro.santos@sebastiana.edu.br' => [
                'Matemática' => ['1º Bimestre' => [8.0, 8.5], '2º Bimestre' => [7.5, 8.0]],
                'Língua Portuguesa e Literatura' => ['1º Bimestre' => [7.5, 8.0], '2º Bimestre' => [8.0, 8.5]],
                'Física' => ['1º Bimestre' => [9.5, 10.0], '2º Bimestre' => [9.0, 9.5]],
                'História Geral e do Brasil' => ['1º Bimestre' => [8.0, 8.5], '2º Bimestre' => [8.5, 9.0]],
            ],
            'beatriz.lima@sebastiana.edu.br' => [
                'Matemática' => ['1º Bimestre' => [7.0, 7.5], '2º Bimestre' => [8.0, 8.5]],
                'Língua Portuguesa e Literatura' => ['1º Bimestre' => [8.5, 9.0], '2º Bimestre' => [8.5, 9.0]],
                'Física' => ['1º Bimestre' => [7.0, 7.5], '2º Bimestre' => [7.5, 8.0]],
                'História Geral e do Brasil' => ['1º Bimestre' => [8.5, 9.0], '2º Bimestre' => [9.0, 9.0]],
            ],
        ];

        $disciplinasMap = [
            'Matemática' => $discMat->id_disciplina,
            'Língua Portuguesa e Literatura' => $discPort->id_disciplina,
            'Física' => $discFis->id_disciplina,
            'História Geral e do Brasil' => $discHist->id_disciplina,
        ];

        foreach ($notasBase as $email => $discs) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                continue;
            }

            foreach ($discs as $discNome => $periodos) {
                $disciplinaId = $disciplinasMap[$discNome];

                foreach ($periodos as $periodo => $valores) {
                    // Avaliação 1: Prova Bimestral
                    Nota::updateOrCreate(
                        [
                            'turma_id' => $turma1A->id_turma,
                            'disciplina_id' => $disciplinaId,
                            'usuario_id' => $user->id,
                            'periodo_letivo' => $periodo,
                            'tipo_avaliacao' => 'Prova Bimestral',
                        ],
                        [
                            'valor_nota' => $valores[0],
                            'valor_maximo' => 10.0,
                            'data_registro' => now()->format('Y-m-d'),
                        ]
                    );

                    // Avaliação 2: Trabalho em Grupo
                    Nota::updateOrCreate(
                        [
                            'turma_id' => $turma1A->id_turma,
                            'disciplina_id' => $disciplinaId,
                            'usuario_id' => $user->id,
                            'periodo_letivo' => $periodo,
                            'tipo_avaliacao' => 'Trabalho em Grupo',
                        ],
                        [
                            'valor_nota' => $valores[1],
                            'valor_maximo' => 10.0,
                            'data_registro' => now()->format('Y-m-d'),
                        ]
                    );
                }
            }
        }
    }
}
