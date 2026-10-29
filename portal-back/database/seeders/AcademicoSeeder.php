<?php

namespace Database\Seeders;

use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * AcademicoSeeder - Povoamento enxuto do ambiente acadêmico estruturado por Ciclos.
 *
 * Papel Didático:
 * - Cria os 3 Ciclos Escolares fundamentais do Ensino Médio;
 * - Associa as turmas aos respectivos ciclos para herança automática de disciplinas;
 * - Cadastra disciplinas com aulas semanais (base 40 semanas) e campos pedagógicos (BNCC, ementa);
 * - Vincula as disciplinas aos Ciclos e aos Professores canônicos (Carlos Silva e Marina Souza);
 * - Sincroniza os vínculos em turma_disciplinas e matricular os alunos canônicos.
 */
class AcademicoSeeder extends Seeder
{
    /**
     * Executa o povoamento acadêmico sem redundâncias ou dados dispersos.
     */
    public function run(): void
    {
        // 1. Ciclos Escolares Canônicos (Diretriz 3.1)
        $ciclo1 = Ciclo::firstOrCreate(['nome' => '1º Ano - Ensino Médio']);
        $ciclo2 = Ciclo::firstOrCreate(['nome' => '2º Ano - Ensino Médio']);
        $ciclo3 = Ciclo::firstOrCreate(['nome' => '3º Ano - Ensino Médio']);

        // 2. As 3 Turmas Escolares Ativas com Ciclos Atribuídos
        $turma1A = Turma::updateOrCreate(
            ['nome_identificador' => '1º Ano A - Ensino Médio'],
            [
                'ciclo_id' => $ciclo1->id_ciclo,
                'turno' => 'Matutino',
                'ano_letivo' => 2026,
                'capacidade_maxima' => 40,
                'status' => 'Ativa',
            ]
        );

        $turma2B = Turma::updateOrCreate(
            ['nome_identificador' => '2º Ano B - Ensino Médio'],
            [
                'ciclo_id' => $ciclo2->id_ciclo,
                'turno' => 'Vespertino',
                'ano_letivo' => 2026,
                'capacidade_maxima' => 35,
                'status' => 'Ativa',
            ]
        );

        $turma3A = Turma::updateOrCreate(
            ['nome_identificador' => '3º Ano A - Informática Integrado'],
            [
                'ciclo_id' => $ciclo3->id_ciclo,
                'turno' => 'Integral',
                'ano_letivo' => 2026,
                'capacidade_maxima' => 35,
                'status' => 'Ativa',
            ]
        );

        // 3. Componentes Curriculares (Disciplinas) com Aulas Semanais e Campos BNCC
        $discMat = Disciplina::updateOrCreate(
            ['nome' => 'Matemática'],
            [
                'aulas_semanais' => 3,
                'carga_horaria_anual' => 120,
                'descricao' => 'Álgebra, geometria analítica, trigonometria e funções matemáticas.',
                'ementa' => 'Estudo de funções afim, quadrática, exponencial e logarítmica; matrizes, determinantes e sistemas lineares; geometria espacial e estatística básica.',
                'habilidades_bncc' => 'EM13MAT101, EM13MAT201, EM13MAT301',
                'objetivo_geral' => 'Desenvolver o raciocínio lógico-matemático e a resolução de problemas cotidianos.',
                'objetivo_especifico' => 'Dominar cálculos algébricos, interpretar gráficos e modelar fenômenos reais.',
            ]
        );

        $discPort = Disciplina::updateOrCreate(
            ['nome' => 'Língua Portuguesa e Literatura'],
            [
                'aulas_semanais' => 3,
                'carga_horaria_anual' => 120,
                'descricao' => 'Interpretação textual, produção dissertativa e análise de obras literárias.',
                'ementa' => 'Leitura crítica, produção textual dissertativo-argumentativa padrão ENEM, análise estilística e movimentos literários brasileiros.',
                'habilidades_bncc' => 'EM13LP01, EM13LP05, EM13LP12',
                'objetivo_geral' => 'Aprimorar a competência comunicativa oral e escrita e a fruição literária.',
                'objetivo_especifico' => 'Redigir textos dissertativos coesos e interpretar textos verbais e não-verbais.',
            ]
        );

        $discFis = Disciplina::updateOrCreate(
            ['nome' => 'Física'],
            [
                'aulas_semanais' => 2,
                'carga_horaria_anual' => 80,
                'descricao' => 'Mecânica clássica, leis de Newton, óptica geométrica e termodinâmica.',
                'ementa' => 'Cinemática escalar e vetorial, dinâmica newtoniana, trabalho e energia, calorimetria e óptica.',
                'habilidades_bncc' => 'EM13CNT101, EM13CNT204',
                'objetivo_geral' => 'Compreender os fenômenos físicos e as leis que regem o universo material.',
                'objetivo_especifico' => 'Aplicar conceitos de mecânica e termodinâmica em situações práticas.',
            ]
        );

        $discHist = Disciplina::updateOrCreate(
            ['nome' => 'História Geral e do Brasil'],
            [
                'aulas_semanais' => 2,
                'carga_horaria_anual' => 80,
                'descricao' => 'História contemporânea, formação social e econômica do Brasil.',
                'ementa' => 'Colonização, Império e República no Brasil; Guerras Mundiais e Guerra Fria; Cidadania e Direitos Humanos.',
                'habilidades_bncc' => 'EM13CHS102, EM13CHS203',
                'objetivo_geral' => 'Construir a consciência histórica crítica e a identidade cidadã.',
                'objetivo_especifico' => 'Analisar processos históricos e suas continuidades na sociedade atual.',
            ]
        );

        $discDev = Disciplina::updateOrCreate(
            ['nome' => 'Desenvolvimento de Aplicações Web'],
            [
                'aulas_semanais' => 3,
                'carga_horaria_anual' => 120,
                'descricao' => 'Arquitetura MVC, REST APIs em Laravel, bancos relacionais e interfaces modernas.',
                'ementa' => 'Desenvolvimento full-stack: rotas, controladores e ORM Eloquent em Laravel; SPA com React e Vite; integração RESTful e autenticação Sanctum.',
                'habilidades_bncc' => 'EM13TEC01, EM13TEC04',
                'objetivo_geral' => 'Capacitar o estudante na construção de sistemas web profissionais.',
                'objetivo_especifico' => 'Construir APIs robustas e interfaces reativas integradas.',
            ]
        );

        // 4. Vínculo das Disciplinas aos Ciclos Escolares (Diretriz 3.2)
        // Matemática, Português, Física e História pertencem aos 3 ciclos
        $discMat->ciclos()->sync([$ciclo1->id_ciclo, $ciclo2->id_ciclo, $ciclo3->id_ciclo]);
        $discPort->ciclos()->sync([$ciclo1->id_ciclo, $ciclo2->id_ciclo, $ciclo3->id_ciclo]);
        $discFis->ciclos()->sync([$ciclo1->id_ciclo, $ciclo2->id_ciclo, $ciclo3->id_ciclo]);
        $discHist->ciclos()->sync([$ciclo1->id_ciclo, $ciclo2->id_ciclo, $ciclo3->id_ciclo]);
        // Desenvolvimento Web é componente específico do 3º ciclo (Ensino Médio Integrado)
        $discDev->ciclos()->sync([$ciclo3->id_ciclo]);

        // 5. Vínculo dos Professores Canônicos às Disciplinas
        $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
        $profaMarina = User::where('email', 'marina.souza@sebastiana.edu.br')->first();

        if ($profCarlos) {
            $profCarlos->disciplinasDocente()->syncWithoutDetaching([
                $discMat->id_disciplina,
                $discFis->id_disciplina,
                $discDev->id_disciplina,
            ]);
        }

        if ($profaMarina) {
            $profaMarina->disciplinasDocente()->syncWithoutDetaching([
                $discPort->id_disciplina,
                $discHist->id_disciplina,
            ]);
        }

        // 6. Sincronização da Herança de Turmas e Professores via Ciclos
        $discMat->sincronizarComTurmasDosCiclos();
        $discPort->sincronizarComTurmasDosCiclos();
        $discFis->sincronizarComTurmasDosCiclos();
        $discHist->sincronizarComTurmasDosCiclos();
        $discDev->sincronizarComTurmasDosCiclos();

        // Reforça explicitamente os vínculos em turma_disciplinas
        $profCarlosId = $profCarlos?->id;
        $profaMarinaId = $profaMarina?->id;

        $disciplinasCarlos = [$discMat, $discFis, $discDev];
        $disciplinasMarina = [$discPort, $discHist];

        foreach ([$turma1A, $turma2B, $turma3A] as $turma) {
            foreach ($disciplinasCarlos as $disc) {
                if ($disc->ciclos()->where('ciclos.id_ciclo', $turma->ciclo_id)->exists()) {
                    TurmaDisciplina::updateOrCreate(
                        ['turma_id' => $turma->id_turma, 'disciplina_id' => $disc->id_disciplina],
                        ['professor_id' => $profCarlosId]
                    );
                }
            }
            foreach ($disciplinasMarina as $disc) {
                if ($disc->ciclos()->where('ciclos.id_ciclo', $turma->ciclo_id)->exists()) {
                    TurmaDisciplina::updateOrCreate(
                        ['turma_id' => $turma->id_turma, 'disciplina_id' => $disc->id_disciplina],
                        ['professor_id' => $profaMarinaId]
                    );
                }
            }
        }

        // 7. Matrícula: Exatamente 1 Aluno Canônico por Turma
        $distribuicaoCanonica = [
            'yasmin.teixeira@aluno.mg.gov.br' => $turma1A,
            'pedro.santos@aluno.mg.gov.br' => $turma2B,
            'beatriz.lima@aluno.mg.gov.br' => $turma3A,
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

        // 8. Frequências: 3 registros por matéria (1 aula por trimestre)
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

            $disciplinasTurma = $turma->disciplinas()->get();

            foreach ($disciplinasTurma as $disc) {
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

        // 9. Notas: 3 registros por matéria (1º, 2º e 3º Trimestres da rede estadual MG)
        $trimestresConfig = [
            '1º Trimestre' => [
                'valor_maximo' => 30.00,
                'nota_padrao' => 28.5,
                'data_registro' => '2026-04-28',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
            '2º Trimestre' => [
                'valor_maximo' => 30.00,
                'nota_padrao' => 28.0,
                'data_registro' => '2026-08-25',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
            '3º Trimestre' => [
                'valor_maximo' => 40.00,
                'nota_padrao' => 38.0,
                'data_registro' => '2026-11-20',
                'tipo_avaliacao' => 'Avaliação Trimestral Consolidada',
            ],
        ];

        foreach ($distribuicaoCanonica as $email => $turma) {
            $aluno = User::where('email', $email)->first();
            if (! $aluno) {
                continue;
            }

            $disciplinasTurma = $turma->disciplinas()->get();

            foreach ($disciplinasTurma as $disc) {
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
