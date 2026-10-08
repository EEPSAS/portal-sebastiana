<?php

namespace Database\Seeders;

use App\Models\Emprestimo;
use App\Models\Livro;
use App\Models\User;
use Illuminate\Database\Seeder;

class BibliotecaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $livros = [
            [
                'titulo' => 'Dom Casmurro',
                'capa' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
                'autor' => 'Machado de Assis',
                'editora' => 'Editora Garnier',
                'data_publicacao' => '1899-01-01',
                'prateleira_localizacao' => 'Corredor A, Estante 1, Prateleira 2',
                'genero' => 'Literatura Brasileira',
                'quantidade_total' => 5,
                'quantidade_disponivel' => 4,
            ],
            [
                'titulo' => 'Capitães da Areia',
                'capa' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
                'autor' => 'Jorge Amado',
                'editora' => 'Companhia das Letras',
                'data_publicacao' => '1937-01-01',
                'prateleira_localizacao' => 'Corredor A, Estante 1, Prateleira 3',
                'genero' => 'Literatura Brasileira',
                'quantidade_total' => 4,
                'quantidade_disponivel' => 4,
            ],
            [
                'titulo' => 'Memórias Póstumas de Brás Cubas',
                'capa' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
                'autor' => 'Machado de Assis',
                'editora' => 'Tipografia Nacional',
                'data_publicacao' => '1881-01-01',
                'prateleira_localizacao' => 'Corredor A, Estante 2, Prateleira 1',
                'genero' => 'Literatura Brasileira',
                'quantidade_total' => 6,
                'quantidade_disponivel' => 5,
            ],
            [
                'titulo' => 'Fundamentos de Física - Mecânica',
                'capa' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
                'autor' => 'Halliday & Resnick',
                'editora' => 'LTC',
                'data_publicacao' => '2016-01-01',
                'prateleira_localizacao' => 'Corredor B, Estante 3, Prateleira 2',
                'genero' => 'Ciências Exatas',
                'quantidade_total' => 8,
                'quantidade_disponivel' => 7,
            ],
            [
                'titulo' => 'Cálculo com Geometria Analítica',
                'capa' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
                'autor' => 'Louis Leithold',
                'editora' => 'Harbra',
                'data_publicacao' => '1994-01-01',
                'prateleira_localizacao' => 'Corredor B, Estante 3, Prateleira 3',
                'genero' => 'Matemática',
                'quantidade_total' => 5,
                'quantidade_disponivel' => 5,
            ],
            [
                'titulo' => 'O Cortiço',
                'capa' => 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400',
                'autor' => 'Aluísio Azevedo',
                'editora' => 'BND Digital',
                'data_publicacao' => '1890-01-01',
                'prateleira_localizacao' => 'Corredor A, Estante 2, Prateleira 4',
                'genero' => 'Naturalismo',
                'quantidade_total' => 3,
                'quantidade_disponivel' => 3,
            ],
        ];

        $livrosCriados = [];
        foreach ($livros as $dados) {
            $livrosCriados[] = Livro::create($dados);
        }

        // Criar empréstimos para alunos
        $yasmin = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();
        $pedro = User::where('email', 'pedro.santos@sebastiana.edu.br')->first();
        $beatriz = User::where('email', 'beatriz.lima@sebastiana.edu.br')->first();

        if ($yasmin && count($livrosCriados) > 0) {
            // Empréstimo ativo (Dom Casmurro)
            Emprestimo::create([
                'livro_id' => $livrosCriados[0]->id_livro,
                'usuario_id' => $yasmin->id,
                'data_emprestimo' => now()->subDays(5),
                'data_prevista_devolucao' => now()->addDays(9),
                'status' => 'aprovado',
                'observacoes' => 'Retirado na biblioteca para trabalho de literatura.',
            ]);

            // Empréstimo concluído anteriormente (Capitães da Areia)
            Emprestimo::create([
                'livro_id' => $livrosCriados[1]->id_livro,
                'usuario_id' => $yasmin->id,
                'data_emprestimo' => now()->subDays(30),
                'data_prevista_devolucao' => now()->subDays(16),
                'data_devolucao_real' => now()->subDays(17),
                'status' => 'devolvido',
                'observacoes' => 'Devolvido em perfeito estado antes do prazo.',
            ]);
        }

        if ($pedro && count($livrosCriados) > 3) {
            // Empréstimo ativo (Física)
            Emprestimo::create([
                'livro_id' => $livrosCriados[3]->id_livro,
                'usuario_id' => $pedro->id,
                'data_emprestimo' => now()->subDays(3),
                'data_prevista_devolucao' => now()->addDays(11),
                'status' => 'aprovado',
                'observacoes' => 'Estudo para Olimpíada de Física.',
            ]);
        }

        if ($beatriz && count($livrosCriados) > 2) {
            // Empréstimo solicitado aguardando aprovação
            Emprestimo::create([
                'livro_id' => $livrosCriados[2]->id_livro,
                'usuario_id' => $beatriz->id,
                'data_emprestimo' => now(),
                'data_prevista_devolucao' => now()->addDays(14),
                'status' => 'solicitado',
                'observacoes' => 'Solicitação via portal web.',
            ]);
        }
    }
}
