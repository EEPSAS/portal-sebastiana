<?php

namespace Database\Seeders;

use App\Models\Atividade;
use App\Models\Disciplina;
use App\Models\Submissao;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Seeder;

class AtividadeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $turma1A = Turma::where('nome_identificador', '1º Ano A - Ensino Médio')->first();
        $turma3A = Turma::where('nome_identificador', '3º Ano A - Informática Integrado')->first();

        $discMat = Disciplina::where('nome', 'Matemática')->first();
        $discPort = Disciplina::where('nome', 'Língua Portuguesa e Literatura')->first();
        $discFis = Disciplina::where('nome', 'Física')->first();
        $discDev = Disciplina::where('nome', 'Desenvolvimento de Aplicações Web')->first();

        $profCarlos = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();
        $profaMarina = User::where('email', 'marina.souza@sebastiana.edu.br')->first();

        $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
        $pedro = User::where('email', 'pedro.santos@sebastiana.edu.br')->first();
        $beatriz = User::where('email', 'beatriz.lima@sebastiana.edu.br')->first();

        if (! $turma1A || ! $profCarlos || ! $profaMarina) {
            return;
        }

        // Atividade 1: Aberta em Matemática
        $ativ1 = Atividade::updateOrCreate(
            ['titulo' => 'Lista de Exercícios: Equações do 2º Grau e Vértice da Parábola'],
            [
                'turma_id' => $turma1A->id_turma,
                'disciplina_id' => $discMat->id_disciplina,
                'usuario_id' => $profCarlos->id,
                'descricao_texto' => 'Resolver todos os exercícios do capítulo 3 (páginas 45 a 48). Apresentar o desenvolvimento completo de cada questão.',
                'caminho_arquivo_anexo' => 'atividades/anexos/lista_equacoes_2grau.pdf',
                'data_criacao' => now()->subDays(2),
                'data_limite_entrega' => now()->addDays(7),
                'valor_pontuacao' => 10.0,
                'status_atividade' => 'Aberta',
            ]
        );

        // Atividade 2: Aberta em Língua Portuguesa
        $ativ2 = Atividade::updateOrCreate(
            ['titulo' => 'Resenha Crítica: Dom Casmurro e a Dúvida Metódica'],
            [
                'turma_id' => $turma1A->id_turma,
                'disciplina_id' => $discPort->id_disciplina,
                'usuario_id' => $profaMarina->id,
                'descricao_texto' => 'Produzir um texto dissertativo-argumentativo de 25 a 30 linhas analisando a perspectiva do narrador Bentinho.',
                'caminho_arquivo_anexo' => null,
                'data_criacao' => now()->subDay(),
                'data_limite_entrega' => now()->addDays(5),
                'valor_pontuacao' => 10.0,
                'status_atividade' => 'Aberta',
            ]
        );

        // Atividade 3: Encerrada em Física (já avaliada)
        $ativ3 = Atividade::updateOrCreate(
            ['titulo' => 'Relatório Prático: Leis de Newton e Plano Inclinado'],
            [
                'turma_id' => $turma1A->id_turma,
                'disciplina_id' => $discFis->id_disciplina,
                'usuario_id' => $profCarlos->id,
                'descricao_texto' => 'Relatório do experimento realizado no laboratório de ciências sobre atrito estático e dinâmico.',
                'caminho_arquivo_anexo' => 'atividades/anexos/roteiro_laboratorio_newton.pdf',
                'data_criacao' => now()->subDays(15),
                'data_limite_entrega' => now()->subDays(3),
                'valor_pontuacao' => 10.0,
                'status_atividade' => 'Encerrada',
            ]
        );

        // Atividade 4: Turma 3A
        if ($turma3A && $discDev) {
            Atividade::updateOrCreate(
                ['titulo' => 'Projeto Final: API RESTful com Laravel e Sanctum'],
                [
                    'turma_id' => $turma3A->id_turma,
                    'disciplina_id' => $discDev->id_disciplina,
                    'usuario_id' => $profCarlos->id,
                    'descricao_texto' => 'Implementação de autenticação via token Bearer, migrations, controllers e validações com Form Requests.',
                    'caminho_arquivo_anexo' => null,
                    'data_criacao' => now()->subDays(3),
                    'data_limite_entrega' => now()->addDays(14),
                    'valor_pontuacao' => 10.0,
                    'status_atividade' => 'Aberta',
                ]
            );
        }

        // Submissões para Atividade 1 (Matemática - Aberta)
        if ($yasmin) {
            Submissao::updateOrCreate(
                [
                    'atividade_id' => $ativ1->id_atividade,
                    'usuario_id' => $yasmin->id,
                ],
                [
                    'data_envio' => now()->subHours(5),
                    'texto_resposta' => 'Prof. Carlos, segue o documento com todos os cálculos desenvolvidos passo a passo.',
                    'caminho_arquivo_entregue' => 'atividades/submissoes/yasmin_lista_equacoes.pdf',
                    'nota_atribuida' => null,
                    'feedback_comentario_professor' => null,
                ]
            );
        }

        // Submissões para Atividade 3 (Física - Encerrada e Avaliada)
        if ($yasmin) {
            Submissao::updateOrCreate(
                [
                    'atividade_id' => $ativ3->id_atividade,
                    'usuario_id' => $yasmin->id,
                ],
                [
                    'data_envio' => now()->subDays(5),
                    'texto_resposta' => 'Relatório final com os gráficos de aceleração vs coeficiente de atrito gerados no Excel.',
                    'caminho_arquivo_entregue' => 'atividades/submissoes/yasmin_relatorio_newton.pdf',
                    'nota_atribuida' => 9.8,
                    'feedback_comentario_professor' => 'Excelente trabalho! Os gráficos e o cálculo do desvio padrão ficaram impecáveis.',
                ]
            );
        }

        if ($pedro) {
            Submissao::updateOrCreate(
                [
                    'atividade_id' => $ativ3->id_atividade,
                    'usuario_id' => $pedro->id,
                ],
                [
                    'data_envio' => now()->subDays(4),
                    'texto_resposta' => 'Entrega do relatório experimental com fotos do procedimento no plano inclinado.',
                    'caminho_arquivo_entregue' => 'atividades/submissoes/pedro_relatorio_newton.pdf',
                    'nota_atribuida' => 9.0,
                    'feedback_comentario_professor' => 'Muito bom. Atente-se apenas à precisão dos algarismos significativos nas tabelas.',
                ]
            );
        }

        if ($beatriz) {
            Submissao::updateOrCreate(
                [
                    'atividade_id' => $ativ3->id_atividade,
                    'usuario_id' => $beatriz->id,
                ],
                [
                    'data_envio' => now()->subDays(4),
                    'texto_resposta' => 'Relatório completo de física com resolução teórica e conclusões.',
                    'caminho_arquivo_entregue' => 'atividades/submissoes/beatriz_relatorio_newton.pdf',
                    'nota_atribuida' => 8.5,
                    'feedback_comentario_professor' => 'Bom relatório. A discussão teórica poderia ser aprofundada.',
                ]
            );
        }
    }
}
