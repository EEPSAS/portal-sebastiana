<?php

namespace Database\Seeders;

use App\Models\Noticia;
use App\Models\User;
use Illuminate\Database\Seeder;

class NoticiaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'adm')->first() ?? User::factory()->create();

        $noticias = [
            [
                'categoria' => 'Acadêmico',
                'titulo' => 'Abertura do Ano Letivo de 2026 reúne comunidade escolar no Colégio Sebastiana',
                'descricao' => 'Direção e corpo docente apresentaram os novos laboratórios de informática e robótica.',
                'conteudo' => 'Com grande entusiasmo, o Colégio Sebastiana deu as boas-vindas aos estudantes para o início do ano letivo de 2026. A instituição inaugurou novos espaços maker e reforçou o compromisso com o ensino integral.',
                'imagem' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300',
                'dataPublicacao' => now()->subDays(10),
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Biblioteca',
                'titulo' => 'Acervo da Biblioteca ganha 200 novas obras de literatura e ciências',
                'descricao' => 'Novos títulos clássicos e científicos já estão disponíveis para empréstimo aos discentes.',
                'conteudo' => 'A biblioteca escolar passou por uma ampla expansão de seu acervo físico e digital, incluindo clássicos do modernismo brasileiro e referências internacionais de exatas.',
                'imagem' => 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=300',
                'dataPublicacao' => now()->subDays(6),
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Eventos',
                'titulo' => 'Inscrições abertas para a Feira de Ciências e Mostra Tecnológica',
                'descricao' => 'Estudantes do Ensino Médio e Técnico podem submeter propostas de projetos até abril.',
                'conteudo' => 'A tradicional Feira de Ciências deste ano terá como foco a sustentabilidade e soluções computacionais para a comunidade local.',
                'imagem' => 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=300',
                'dataPublicacao' => now()->subDays(2),
                'autor_id' => $admin->id,
            ],
        ];

        foreach ($noticias as $dados) {
            Noticia::create($dados);
        }
    }
}
