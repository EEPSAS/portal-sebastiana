<?php

namespace Database\Seeders;

use App\Models\Radioatividade;
use Illuminate\Database\Seeder;

class RadioatividadeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $episodios = [
            [
                'titulo' => 'Episódio #01: A Física no Cotidiano e o Universo das Ondas',
                'descricao' => 'Bate-papo com professores sobre aplicações práticas de física no mundo moderno.',
                'imagem' => 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600',
                'duracao' => '32:45',
            ],
            [
                'titulo' => 'Episódio #02: Machado de Assis e o Realismo Brasileiro',
                'descricao' => 'Análise literária de Dom Casmurro e Memórias Póstumas com alunos do 3º ano.',
                'imagem' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
                'duracao' => '28:10',
            ],
            [
                'titulo' => 'Episódio #03: O Futuro da Inteligência Artificial na Educação',
                'descricao' => 'Discussão interdisciplinar sobre ética, tecnologia e inovação educacional.',
                'imagem' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600',
                'duracao' => '35:20',
            ],
        ];

        foreach ($episodios as $dados) {
            Radioatividade::create($dados);
        }
    }
}
