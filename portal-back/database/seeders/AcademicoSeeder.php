<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Database\Seeder;

// Seeder responsável por estruturar o ambiente acadêmico (turmas, disciplinas, matrículas, frequências e notas).
class AcademicoSeeder extends Seeder
{
    /**
     * Executa o povoamento dos dados acadêmicos com integridade relacional.
     */
    public function run(): void
    {
        // 1. Definição das Turmas Escolares Ativas
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

        $turmas = [$turma1A, $turma2B, $turma3A];

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

        // 3. Professores Cadastrados
        $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
        $profaMarina = User::where('email', 'marina.souza@sebastiana.edu.br')->first();
        $profLucas = User::where('email', 'lucas.mendes@sebastiana.edu.br')->first();
        $profaHelena = User::where('email', 'helena.castro@sebastiana.edu.br')->first();

        // 4. Vínculos Pedagógicos por Turma (TurmaDisciplina)
        // Turma 1A
        if ($profCarlos) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discMat->id_disciplina], ['professor_id' => $profCarlos->id]);
        }
        if ($profaMarina) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discPort->id_disciplina], ['professor_id' => $profaMarina->id]);
        }
        if ($profaHelena) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discFis->id_disciplina], ['professor_id' => $profaHelena->id]);
        }
        if ($profLucas) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma1A->id_turma, 'disciplina_id' => $discHist->id_disciplina], ['professor_id' => $profLucas->id]);
        }

        // Turma 2B
        if ($profCarlos) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma2B->id_turma, 'disciplina_id' => $discMat->id_disciplina], ['professor_id' => $profCarlos->id]);
        }
        if ($profaMarina) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma2B->id_turma, 'disciplina_id' => $discPort->id_disciplina], ['professor_id' => $profaMarina->id]);
        }
        if ($profLucas) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma2B->id_turma, 'disciplina_id' => $discHist->id_disciplina], ['professor_id' => $profLucas->id]);
        }
        if ($profaHelena) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma2B->id_turma, 'disciplina_id' => $discFis->id_disciplina], ['professor_id' => $profaHelena->id]);
        }

        // Turma 3A
        if ($profCarlos) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma3A->id_turma, 'disciplina_id' => $discDev->id_disciplina], ['professor_id' => $profCarlos->id]);
        }
        if ($profaMarina) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma3A->id_turma, 'disciplina_id' => $discPort->id_disciplina], ['professor_id' => $profaMarina->id]);
        }
        if ($profaHelena) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma3A->id_turma, 'disciplina_id' => $discMat->id_disciplina], ['professor_id' => $profaHelena->id]);
        }
        if ($profLucas) {
            TurmaDisciplina::firstOrCreate(['turma_id' => $turma3A->id_turma, 'disciplina_id' => $discHist->id_disciplina], ['professor_id' => $profLucas->id]);
        }

        // 5. Gestão de Matrículas: Distribuição de TODOS os alunos cadastrados entre as 3 turmas
        $todosAlunos = User::where('role', UserRole::ALUNO)->orderBy('id')->get();

        // Mapeamento canônico para manter consistência com dados prévios e testes
        $distribuicaoCanonica = [
            'yasmin.teixeira@sebastiana.edu.br' => $turma1A->id_turma,
            'pedro.santos@sebastiana.edu.br' => $turma1A->id_turma,
            'beatriz.lima@sebastiana.edu.br' => $turma1A->id_turma,
            'gabriel.costa@sebastiana.edu.br' => $turma1A->id_turma,
            'sla.sla2@sebastiana.edu.br' => $turma2B->id_turma,
            'sla.sla4@sebastiana.edu.br' => $turma2B->id_turma,
            'ana-silva.2@aluno.mg.gov.br' => $turma2B->id_turma,
            'carlos-eduardo.2@aluno.mg.gov.br' => $turma2B->id_turma,
            'camila.alves@sebastiana.edu.br' => $turma3A->id_turma,
            'lucas.rocha@sebastiana.edu.br' => $turma3A->id_turma,
            'sla.sla@sebastiana.edu.br' => $turma3A->id_turma,
            'sla.sla3a@sebastiana.edu.br' => $turma3A->id_turma,
            'mariana-santos.2@aluno.mg.gov.br' => $turma3A->id_turma,
            'lucas-oliveira.2@aluno.mg.gov.br' => $turma3A->id_turma,
        ];

        foreach ($todosAlunos as $idx => $aluno) {
            // Se o aluno possui alocação canônica, respeita; caso contrário, distribui ciclicamente
            $turmaIdAlvo = $distribuicaoCanonica[$aluno->email] ?? $turmas[$idx % 3]->id_turma;

            Matricula::updateOrCreate(
                [
                    'turma_id' => $turmaIdAlvo,
                    'usuario_id' => $aluno->id,
                ],
                [
                    'data_matricula' => '2026-02-01',
                    'status_matricula' => 'Ativo',
                ]
            );
        }

        // 6. Frequências (Registros de presença ao longo do ano escolar)
        $datasAulas = [
            '2026-03-02', '2026-03-09', '2026-03-16', '2026-04-06', // 1º Trimestre
            '2026-05-11', '2026-05-18', '2026-06-08', '2026-08-10', // 2º Trimestre
            '2026-09-14', '2026-09-21', '2026-10-05', '2026-10-19', // 3º Trimestre
        ];

        foreach ($turmas as $turma) {
            $disciplinasTurma = $turma->disciplinas()->get();
            $alunosTurma = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();

            foreach ($disciplinasTurma as $disc) {
                foreach ($alunosTurma as $aluno) {
                    foreach ($datasAulas as $idx => $dataAula) {
                        // Presença padrão (95%+), com faltas pontuais controladas para gerar dados realistas
                        $statusPresenca = 'Presente';
                        $justificativa = null;

                        // Yasmin possui assiduidade exemplar (100% de presença)
                        if ($aluno->email !== 'yasmin.teixeira@sebastiana.edu.br') {
                            if ($idx === 3 && ($aluno->id % 3 === 0)) {
                                $statusPresenca = 'Falta Justificada';
                                $justificativa = 'Atestado médico odontológico';
                            } elseif ($idx === 7 && ($aluno->id % 2 === 0)) {
                                $statusPresenca = 'Falta';
                            }
                        }

                        Frequencia::updateOrCreate(
                            [
                                'turma_id' => $turma->id_turma,
                                'disciplina_id' => $disc->id_disciplina,
                                'usuario_id' => $aluno->id,
                                'data_aula' => $dataAula,
                            ],
                            [
                                'quantidade_aulas' => 2,
                                'status_presenca' => $statusPresenca,
                                'justificativa' => $justificativa,
                            ]
                        );
                    }
                }
            }
        }

        // 7. Notas Cumulativas (Regime Trimestral da Rede Estadual de MG - 100 Pontos Anuais)
        // Remove eventuais notas residuais registradas em bimestres para garantir a integridade dos trimestres
        Nota::where('periodo_letivo', 'like', '%Bimestre%')->delete();

        // 1º Trimestre: 30 pontos (aprovação >= 18.0)
        // 2º Trimestre: 35 pontos (aprovação >= 21.0)
        // 3º Trimestre: 35 pontos (aprovação >= 21.0)
        // Total acumulado no ano = 100 pontos (mínimo anual para aprovação = 60.0 pontos)
        $trimestresConfig = [
            '1º Trimestre' => [
                'valor_maximo' => 30.00,
                'data_registro' => '2026-04-28',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
            '2º Trimestre' => [
                'valor_maximo' => 35.00,
                'data_registro' => '2026-08-25',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
            '3º Trimestre' => [
                'valor_maximo' => 35.00,
                'data_registro' => '2026-11-20',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
        ];

        // Perfis específicos de desempenho para estudantes-chave
        $desempenhosEspecificos = [
            'yasmin.teixeira@sebastiana.edu.br' => [
                'Matemática' => [28.5, 33.5, 34.0],
                'Língua Portuguesa e Literatura' => [29.0, 34.0, 34.5],
                'Física' => [27.0, 32.0, 33.0],
                'História Geral e do Brasil' => [28.0, 33.0, 34.0],
            ],
            'pedro.santos@sebastiana.edu.br' => [
                'Matemática' => [25.0, 29.0, 30.0],
                'Língua Portuguesa e Literatura' => [24.5, 28.5, 29.5],
                'Física' => [27.5, 31.5, 32.0],
                'História Geral e do Brasil' => [26.0, 30.0, 31.0],
            ],
            'beatriz.lima@sebastiana.edu.br' => [
                'Matemática' => [22.5, 27.0, 29.0],
                'Língua Portuguesa e Literatura' => [26.0, 30.5, 32.0],
                'Física' => [23.0, 26.5, 28.0],
                'História Geral e do Brasil' => [27.0, 31.0, 32.5],
            ],
            'gabriel.costa@sebastiana.edu.br' => [
                'Matemática' => [26.5, 30.5, 31.5],
                'Língua Portuguesa e Literatura' => [19.0, 22.5, 24.0],
                'Física' => [25.0, 29.5, 30.0],
                'História Geral e do Brasil' => [18.5, 22.0, 23.5],
            ],
            'camila.alves@sebastiana.edu.br' => [
                'Desenvolvimento de Aplicações Web' => [29.5, 34.5, 35.0],
                'Língua Portuguesa e Literatura' => [27.0, 31.5, 33.0],
                'Matemática' => [28.0, 32.5, 33.5],
                'História Geral e do Brasil' => [26.5, 30.0, 31.5],
            ],
            'lucas.rocha@sebastiana.edu.br' => [
                'Desenvolvimento de Aplicações Web' => [26.0, 30.0, 31.0],
                'Língua Portuguesa e Literatura' => [24.0, 28.0, 29.5],
                'Matemática' => [25.5, 29.0, 30.5],
                'História Geral e do Brasil' => [24.5, 28.5, 29.0],
            ],
        ];

        foreach ($turmas as $turma) {
            $disciplinasTurma = $turma->disciplinas()->get();
            $alunosTurma = $turma->alunos()->wherePivot('status_matricula', 'Ativo')->get();

            foreach ($alunosTurma as $aluno) {
                foreach ($disciplinasTurma as $disc) {
                    $triIdx = 0;

                    foreach ($trimestresConfig as $periodo => $cfg) {
                        $valorMaximo = $cfg['valor_maximo'];

                        // Verifica se existe perfil detalhado predefinido para o aluno e matéria
                        if (isset($desempenhosEspecificos[$aluno->email][$disc->nome][$triIdx])) {
                            $valorNota = $desempenhosEspecificos[$aluno->email][$disc->nome][$triIdx];
                        } else {
                            // Algoritmo determinístico para os demais alunos: aproveitamento entre 65% e 92%
                            $fatorBase = 0.72 + (($aluno->id * 7 + $disc->id_disciplina * 11 + $triIdx * 5) % 22) / 100.0;

                            // Caso pontual de aluno com dificuldade para enriquecer indicadores do dashboard
                            if ($aluno->email === 'sla.sla4@sebastiana.edu.br' && $disc->nome === 'Física') {
                                $fatorBase = 0.52; // Abaixo dos 60%
                            }

                            $valorNota = round($valorMaximo * min(0.96, max(0.50, $fatorBase)), 1);
                        }

                        // Lançamento oficial da nota acumulativa pertencente ao aluno na turma
                        Nota::updateOrCreate(
                            [
                                'turma_id' => $turma->id_turma,
                                'disciplina_id' => $disc->id_disciplina,
                                'usuario_id' => $aluno->id,
                                'periodo_letivo' => $periodo,
                            ],
                            [
                                'tipo_avaliacao' => $cfg['tipo_avaliacao'],
                                'valor_nota' => $valorNota,
                                'valor_maximo' => $valorMaximo,
                                'data_registro' => $cfg['data_registro'],
                                'observacoes' => "Pontuação cumulativa oficial do {$periodo} (máximo {$valorMaximo} pts)",
                            ]
                        );

                        $triIdx++;
                    }
                }
            }
        }
    }
}
